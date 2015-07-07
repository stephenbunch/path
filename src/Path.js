import { overrideProperty } from './util';

const pathListenersKey = Symbol();

function isValidObject( obj ) {
  return typeof obj === 'object' && obj !== null;
}

function isPropWritable( obj, prop ) {
  var descriptor = Object.getOwnPropertyDescriptor( obj, prop );
  return !!( descriptor && ( descriptor.set || descriptor.writable ) );
}

export default class Path {
  constructor( value ) {
    this.value = value;
    this.segments = value.split( '.' );
  }

  override( obj, descriptor ) {
    this._validateObject( obj );
    var restore = [];
    var teardown = index => {
      restore.splice( index ).reverse().forEach( func => func() );
    };
    var setup = ( index, node, set ) => {
      // Remove all the property overrides from this path segment and down.
      teardown( index );
      // Setup new overrides as long as there's a valid node in the path.
      var i = index;
      for ( ; i < this.segments.length - 1; i++ ) {
        if ( !isValidObject( node ) ) {
          break;
        }
        let prop = this.segments[ i ];
        if ( descriptor.persist && !isValidObject( node[ prop ] ) ) {
          node[ prop ] = {};
        }
        restore[ i ] = overrideProperty( node, prop, {
          configurable: true,
          enumerable: true,
          get( $super ) {
            return $super();
          },
          set( value, $super ) {
            if ( value !== $super() ) {
              if ( descriptor.persist && !isValidObject( value ) ) {
                value = {};
              }
              $super( value );
              setup( index + 1, value, true );
            }
          }
        });
        node = node[ prop ];
      }
      // Setup the last segment.
      if ( i === this.segments.length - 1 && isValidObject( node ) ) {
        let prop = this.segments[ i ];

        // If this is a set operation, run the value through the setter to
        // trigger any handlers.
        let value;
        let applySetter = false;
        if ( set && isPropWritable( node, prop ) ) {
          value = node[ prop ];
          applySetter = true;
        }

        restore[ i ] = overrideProperty( node, prop, {
          configurable: true,
          enumerable: true,
          get: descriptor.get,
          set: descriptor.set
        });

        if ( applySetter ) {
          node[ prop ] = value;
        }
      } else if ( set && descriptor.set ) {
        // This actually doesn't make sense in the context of overriding a
        // property setter since the owning object doesn't exist. But the
        // purpose of this library is to be able to override the path as a
        // whole, so when the owning object becomes undefined, it makes sense to
        // pass undefined to the setter since the value at that particular path
        // is now undefined.
        descriptor.set( undefined, () => {} );
      }
    };
    setup( 0, obj, false );
    return function() {
      teardown( 0 );
    }
  }

  watch( obj, listener ) {
    this._validateObject( obj );
    var store = obj[ pathListenersKey ];
    if ( !store ) {
      store = obj[ pathListenersKey ] = {};
    }
    var listeners = store[ this.value ];
    if ( !listeners ) {
      listeners = store[ this.value ] = [];
      let unwatch = this.override( obj, {
        get( $super ) {
          return $super();
        },
        set( value, $super ) {
          var oldval = curval;
          $super( value );
          var newval = $super();
          curval = newval;
          if ( newval !== oldval ) {
            listeners.slice().forEach( listener => {
              listener.call( undefined, newval, oldval );
            });
          }
        }
      });
      let curval = this.get( obj );
      listeners.teardown = () => {
        unwatch();
        delete store[ this.value ];
      };
    }
    listeners.push( listener );
    return () => {
      this.unwatch( obj, listener );
    };
  }

  unwatch( obj, listener ) {
    var store = obj && obj[ pathListenersKey ];
    var listeners = store && store[ this.value ] || [];
    var index = listeners.indexOf( listener );
    if ( index > -1 ) {
      listeners.splice( index, 1 );
      if ( listeners.length === 0 ) {
        listeners.teardown();
      }
    }
  }

  get( obj ) {
    for ( let segment of this.segments ) {
      if ( typeof obj !== 'object' || obj === null ) {
        return;
      }
      obj = obj[ segment ];
    }
    return obj;
  }

  set( obj, value ) {
    if ( typeof obj !== 'object' || obj === null ) {
      return;
    }
    for ( let segment of this.segments.slice( 0, -1 ) ) {
      let value = obj[ segment ];
      if ( typeof value !== 'object' || value === null ) {
        value = obj[ segment ] = {};
      }
      obj = value;
    }
    obj[ this.segments[ this.segments.length - 1 ] ] = value;
  }

  _validateObject( obj ) {
    if ( obj === null ) {
      throw new Error( 'Object cannot be null.' );
    }
    if ( typeof obj !== 'object' ) {
      throw new Error( 'First argument must be an object.' );
    }
  }
};
