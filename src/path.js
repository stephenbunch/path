import {
  forEach,
  extend,
  overrideProperty,
  watch,
  unwatch
} from './util';

export default class Path {
  constructor( path ) {
    this.value = path;
    this.path = path.split( '.' );
  }

  override( obj, descriptor ) {
    var overrides = [{ value: obj }];
    var path = this.path.slice();
    var last = path.length - 1;

    descriptor = extend({
      enumerable: true,
      configurable: true,
      persist: false,
      initialize: true
    }, descriptor );

    var persist = descriptor.persist;
    var initialize = descriptor.initialize;
    delete descriptor.persist;
    delete descriptor.initialize;

    function setup( position ) {
      forEach( path, function( prop, index ) {
        if ( index < position ) {
          return;
        }

        var obj = overrides[ index ].value;
        var override = {};
        overrides.push( override );

        if ( index === last ) {
          var property = overrideProperty( obj, prop, descriptor );
          override.restore = property.restore;
          if ( initialize && !!descriptor.set ) {
            obj[ prop ] = property.$super();
          }
        } else {
          override.value = obj[ prop ];
          override.restore = watch( obj, prop, function( e ) {
            override.value = e.newval;
            if ( typeof e.oldval === 'object' ) {
              restore( index + 1 );
            }
            if ( typeof e.newval === 'object' ) {
              setup( index + 1 );
            }
          });
          if ( typeof override.value !== 'object' || override.value === null ) {
            if ( !persist ) {
              return false;
            } else {
              override.value = obj[ prop ] = {};
            }
          }
        }
      });
    }

    function restore( position ) {
      overrides.splice( position + 1 ).reverse().forEach( function( override ) {
        override.restore();
      });
    }

    setup( 0 );
    return function() {
      restore( 0 );
    };
  }

  watch( obj, listener ) {
    if ( !obj ) {
      return;
    }
    var store = obj.$$pathListeners;
    if ( !store ) {
      Object.defineProperty( obj, '$$pathListeners', {
        value: {},
        configurable: false,
        enumerable: false
      });
      store = obj.$$pathListeners;
    }
    if ( !store[ this.value ] ) {
      var listeners = store[ this.value ] = [];
      var curval;
      var initialized = false;
      var restore = this.override( obj, {
        get: function() {
          return this.$super();
        },
        set: function( value ) {
          if ( !initialized ) {
            curval = value;
          } else {
            value = this.$super( value );
            if ( value !== curval ) {
              var oldval = curval;
              curval = value;
              listeners.slice().forEach( function( listener ) {
                listener.call( undefined, value, oldval );
              });
            }
          }
        }
      });
      initialized = true;
      listeners.destroy = ( function( path ) {
        restore();
        delete store[ path ];
      }).bind( undefined, this.value );
    }
    store[ this.value ].push( listener );
  }

  unwatch( obj, listener ) {
    var listeners = obj && obj.$$pathListeners;
    if ( listeners && listeners[ this.value ] ) {
      var index = listeners[ this.value ].indexOf( listener );
      if ( index > -1 ) {
        listeners[ this.value ].splice( index, 1 );
        if ( listeners[ this.value ].length === 0 ) {
          listeners[ this.value ].destroy();
        }
      }
    }
  }

  get( obj ) {
    if ( typeof obj !== 'object' || obj === null ) {
      return;
    }
    var ret = obj;
    var i = 0;
    var lastIndex = this.path.length - 1;
    for ( ; i < lastIndex; i++ ) {
      ret = ret[ this.path[ i ] ];
      if ( typeof ret !== 'object' || ret === null ) {
        break;
      }
    }
    return ret && ret[ this.path[ lastIndex ] ];
  }

  set( obj, value ) {
    var i = 0;
    var lastIndex = this.path.length - 1;
    for ( ; i < lastIndex; i++ ) {
      if ( typeof obj[ this.path[ i ] ] !== 'object' ) {
        obj[ this.path[ i ] ] = {};
      }
      obj = obj[ this.path[ i ] ];
    }
    obj[ this.path[ lastIndex ] ] = value;
  }
}
