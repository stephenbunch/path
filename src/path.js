function Path( path ) {
  if ( !( this instanceof Path ) ) {
    return new Path( path );
  }
  this.value = path;
  this.path = path.split( '.' );
}

Path.prototype.override = function( obj, descriptor ) {
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
};

Path.prototype.watch = function( obj, listener ) {
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
};

Path.prototype.get = function( obj ) {
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
};

Path.prototype.set = function( obj, value ) {
  var i = 0;
  var lastIndex = this.path.length - 1;
  for ( ; i < lastIndex; i++ ) {
    if ( typeof obj[ this.path[ i ] ] !== 'object' ) {
      obj[ this.path[ i ] ] = {};
    }
    obj = obj[ this.path[ i ] ];
  }
  obj[ this.path[ lastIndex ] ] = value;
};

function overrideProperty( obj, prop, descriptor ) {
  var value;
  var superDescriptor = Object.getOwnPropertyDescriptor( obj, prop );

  if ( !superDescriptor || superDescriptor.hasOwnProperty( 'value' ) ) {
    value = obj[ prop ];
  }

  var superGet =
    superDescriptor &&
    superDescriptor.get &&
    bind( superDescriptor.get, obj ) ||
    function() {
      return value;
    };

  var superSet =
    superDescriptor &&
    superDescriptor.set &&
    bind( superDescriptor.set, obj ) ||
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

function watch( obj, prop, listener ) {
  if ( !obj.hasOwnProperty( '$$pathListeners' ) ) {
    Object.defineProperty( obj, '$$pathListeners', {
      value: {},
      configurable: false,
      enumerable: false
    });
  }

  var listeners = obj.$$pathListeners;
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
  return bind( unwatch, undefined, obj, prop, listener );
}

function unwatch( obj, prop, listener ) {
  var listeners = obj.$$pathListeners;
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
