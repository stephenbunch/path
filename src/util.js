export function forEach( array, callback ) {
  var i = 0, len = array.length;
  for ( ; i < len; i++ ) {
    if ( callback.call( array, array[ i ], i ) === false ) {
      break;
    }
  }
}

export function extend( target, source ) {
  source = source || {};
  for ( var p in source ) {
    if ( source.hasOwnProperty( p ) ) {
      target[ p ] = source[ p ];
    }
  }
  return target;
}

export function overrideProperty( obj, prop, descriptor ) {
  var value;
  var superDescriptor = Object.getOwnPropertyDescriptor( obj, prop );

  if ( !superDescriptor || superDescriptor.hasOwnProperty( 'value' ) ) {
    value = obj[ prop ];
  }

  var superGet =
    superDescriptor &&
    superDescriptor.get &&
    superDescriptor.get.bind( obj ) ||
    function() {
      return value;
    };

  var superSet =
    superDescriptor &&
    superDescriptor.set &&
    superDescriptor.set.bind( obj ) ||
    function( newval ) {
      value = newval;
    };

  function $super( newval ) {
    if ( arguments.length ) {
      superSet( newval );
    }
    return superGet();
  }

  function override( accessor ) {
    return function() {
      var ret;
      if ( this.hasOwnProperty( '$super' ) ) {
        var _super = this.$super;
        this.$super = $super;
        ret = accessor.apply( this, arguments );
        this.$super = _super;
      } else {
        this.$super = $super;
        ret = accessor.apply( this, arguments );
        delete this.$super;
      }
      return ret;
    };
  }

  var overrideGet = descriptor.get && override( descriptor.get );
  var overrideSet = descriptor.set && override( descriptor.set );

  var definition = extend( {}, descriptor );

  definition.get = definition.get && function() {
    return overrideGet ? overrideGet.call( this ) : superGet();
  } || undefined;

  definition.set = definition.set && function( newval ) {
    overrideSet ? overrideSet.call( this, newval ) : superSet( newval );
  } || undefined;

  Object.defineProperty( obj, prop, definition );

  return {
    $super: $super,
    restore: function() {
      if ( superDescriptor ) {
        if ( superDescriptor.hasOwnProperty( 'value' ) ) {
          superDescriptor.value = value;
        }
        Object.defineProperty( obj, prop, superDescriptor );
      } else {
        var curval = obj[ prop ];
        delete obj[ prop ];
        obj[ prop ] = curval;
      }
    }
  };
}

export function watch( obj, prop, listener ) {
  if ( !obj.hasOwnProperty( '$$propListeners' ) ) {
    Object.defineProperty( obj, '$$propListeners', {
      value: {},
      configurable: false,
      enumerable: false
    });
  }

  var listeners = obj.$$propListeners;
  if ( !listeners[ prop ] ) {
    listeners[ prop ] = [];
    var descriptor = Object.getOwnPropertyDescriptor( obj, prop );
    listeners[ prop ].descriptor = descriptor;

    var value;
    var superGet = descriptor && descriptor.get;
    var superSet = descriptor && descriptor.set;
    if ( !superGet ) {
      value = obj[ prop ];
    }

    Object.defineProperty( obj, prop, {
      enumerable: true,
      configurable: true,
      get: function() {
        return superGet ? superGet() : value;
      },
      set: function( newval ) {
        var curval = obj[ prop ];
        if ( superSet ) {
          superSet( newval );
        } else {
          value = newval;
        }
        newval = obj[ prop ];
        if ( curval !== newval ) {
          listeners[ prop ].forEach( function( listener ) {
            listener({
              oldval: curval,
              newval: newval
            });
          });
        }
      }
    });
  }

  listeners[ prop ].push( listener );
  return unwatch.bind( undefined, obj, prop, listener );
}

export function unwatch( obj, prop, listener ) {
  var listeners = obj.$$propListeners;
  if ( listeners && listeners[ prop ] ) {
    var index = listeners[ prop ].indexOf( listener );
    if ( index > -1 ) {
      listeners[ prop ].splice( index, 1 );
      if ( listeners[ prop ].length === 0 ) {
        if ( listeners[ prop ].descriptor ) {
          Object.defineProperty( obj, prop, listeners[ prop ].descriptor );
        } else {
          var curval = obj[ prop ];
          delete obj[ prop ];
          obj[ prop ] = curval;
        }
        delete listeners[ prop ];
      }
    }
  }
}
