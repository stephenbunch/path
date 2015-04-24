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
    var curval;
    var initialized = false;
    var restoreFunc = this.override( obj, {
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
            listener.call( undefined, {
              oldval: oldval,
              newval: value
            });
          }
        }
      }
    });
    initialized = true;
    return restoreFunc;
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
