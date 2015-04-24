(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pathy = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _forEach$extend$overrideProperty$watch$unwatch = require('./util');

var Path = (function () {
  function Path(path) {
    _classCallCheck(this, Path);

    this.value = path;
    this.path = path.split('.');
  }

  _createClass(Path, [{
    key: 'override',
    value: function override(obj, descriptor) {
      var overrides = [{ value: obj }];
      var path = this.path.slice();
      var last = path.length - 1;

      descriptor = _forEach$extend$overrideProperty$watch$unwatch.extend({
        enumerable: true,
        configurable: true,
        persist: false,
        initialize: true
      }, descriptor);

      var persist = descriptor.persist;
      var initialize = descriptor.initialize;
      delete descriptor.persist;
      delete descriptor.initialize;

      function setup(position) {
        _forEach$extend$overrideProperty$watch$unwatch.forEach(path, function (prop, index) {
          if (index < position) {
            return;
          }

          var obj = overrides[index].value;
          var override = {};
          overrides.push(override);

          if (index === last) {
            var property = _forEach$extend$overrideProperty$watch$unwatch.overrideProperty(obj, prop, descriptor);
            override.restore = property.restore;
            if (initialize && !!descriptor.set) {
              obj[prop] = property.$super();
            }
          } else {
            override.value = obj[prop];
            override.restore = _forEach$extend$overrideProperty$watch$unwatch.watch(obj, prop, function (e) {
              override.value = e.newval;
              if (typeof e.oldval === 'object') {
                restore(index + 1);
              }
              if (typeof e.newval === 'object') {
                setup(index + 1);
              }
            });
            if (typeof override.value !== 'object' || override.value === null) {
              if (!persist) {
                return false;
              } else {
                override.value = obj[prop] = {};
              }
            }
          }
        });
      }

      function restore(position) {
        overrides.splice(position + 1).reverse().forEach(function (override) {
          override.restore();
        });
      }

      setup(0);
      return function () {
        restore(0);
      };
    }
  }, {
    key: 'watch',
    value: function watch(obj, listener) {
      var curval;
      var initialized = false;
      var restoreFunc = this.override(obj, {
        get: function get() {
          return this.$super();
        },
        set: function set(value) {
          if (!initialized) {
            curval = value;
          } else {
            value = this.$super(value);
            if (value !== curval) {
              var oldval = curval;
              curval = value;
              listener.call(undefined, {
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
  }, {
    key: 'get',
    value: function get(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }
      var ret = obj;
      var i = 0;
      var lastIndex = this.path.length - 1;
      for (; i < lastIndex; i++) {
        ret = ret[this.path[i]];
        if (typeof ret !== 'object' || ret === null) {
          break;
        }
      }
      return ret && ret[this.path[lastIndex]];
    }
  }, {
    key: 'set',
    value: function set(obj, value) {
      var i = 0;
      var lastIndex = this.path.length - 1;
      for (; i < lastIndex; i++) {
        if (typeof obj[this.path[i]] !== 'object') {
          obj[this.path[i]] = {};
        }
        obj = obj[this.path[i]];
      }
      obj[this.path[lastIndex]] = value;
    }
  }]);

  return Path;
})();

exports['default'] = Path;
module.exports = exports['default'];

},{"./util":3}],2:[function(require,module,exports){
'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Path = require('./Path');

var _Path2 = _interopRequireWildcard(_Path);

function pathFactory() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var path = Object.create(_Path2['default'].prototype);
  _Path2['default'].prototype.constructor.apply(path, args);
  return path;
}

pathFactory.Path = _Path2['default'];

exports['default'] = pathFactory;
module.exports = exports['default'];

},{"./Path":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.forEach = forEach;
exports.extend = extend;
exports.overrideProperty = overrideProperty;
exports.watch = watch;
exports.unwatch = unwatch;

function forEach(array, callback) {
  var i = 0,
      len = array.length;
  for (; i < len; i++) {
    if (callback.call(array, array[i], i) === false) {
      break;
    }
  }
}

function extend(target, source) {
  source = source || {};
  for (var p in source) {
    if (source.hasOwnProperty(p)) {
      target[p] = source[p];
    }
  }
  return target;
}

function overrideProperty(obj, prop, descriptor) {
  var value;
  var superDescriptor = Object.getOwnPropertyDescriptor(obj, prop);

  if (!superDescriptor || superDescriptor.hasOwnProperty('value')) {
    value = obj[prop];
  }

  var superGet = superDescriptor && superDescriptor.get && superDescriptor.get.bind(obj) || function () {
    return value;
  };

  var superSet = superDescriptor && superDescriptor.set && superDescriptor.set.bind(obj) || function (newval) {
    value = newval;
  };

  function $super(newval) {
    if (arguments.length) {
      superSet(newval);
    }
    return superGet();
  }

  function override(accessor) {
    return function () {
      var ret;
      if (this.hasOwnProperty('$super')) {
        var _super = this.$super;
        this.$super = $super;
        ret = accessor.apply(this, arguments);
        this.$super = _super;
      } else {
        this.$super = $super;
        ret = accessor.apply(this, arguments);
        delete this.$super;
      }
      return ret;
    };
  }

  var overrideGet = descriptor.get && override(descriptor.get);
  var overrideSet = descriptor.set && override(descriptor.set);

  var definition = extend({}, descriptor);

  definition.get = definition.get && function () {
    return overrideGet ? overrideGet.call(this) : superGet();
  } || undefined;

  definition.set = definition.set && function (newval) {
    overrideSet ? overrideSet.call(this, newval) : superSet(newval);
  } || undefined;

  Object.defineProperty(obj, prop, definition);

  return {
    $super: $super,
    restore: function restore() {
      if (superDescriptor) {
        if (superDescriptor.hasOwnProperty('value')) {
          superDescriptor.value = value;
        }
        Object.defineProperty(obj, prop, superDescriptor);
      } else {
        var curval = obj[prop];
        delete obj[prop];
        obj[prop] = curval;
      }
    }
  };
}

function watch(obj, prop, listener) {
  if (!obj.hasOwnProperty('$$pathListeners')) {
    Object.defineProperty(obj, '$$pathListeners', {
      value: {},
      configurable: false,
      enumerable: false
    });
  }

  var listeners = obj.$$pathListeners;
  if (!listeners[prop]) {
    listeners[prop] = [];
    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    listeners[prop].descriptor = descriptor;

    var value;
    var superGet = descriptor && descriptor.get;
    var superSet = descriptor && descriptor.set;
    if (!superGet) {
      value = obj[prop];
    }

    Object.defineProperty(obj, prop, {
      enumerable: true,
      configurable: true,
      get: function get() {
        return superGet ? superGet() : value;
      },
      set: function set(newval) {
        var curval = obj[prop];
        if (superSet) {
          superSet(newval);
        } else {
          value = newval;
        }
        newval = obj[prop];
        if (curval !== newval) {
          listeners[prop].forEach(function (listener) {
            listener({
              oldval: curval,
              newval: newval
            });
          });
        }
      }
    });
  }

  listeners[prop].push(listener);
  return unwatch.bind(undefined, obj, prop, listener);
}

function unwatch(obj, prop, listener) {
  var listeners = obj.$$pathListeners;
  if (listeners && listeners[prop]) {
    var index = listeners[prop].indexOf(listener);
    if (index > -1) {
      listeners[prop].splice(index, 1);
      if (listeners[prop].length === 0) {
        if (listeners[prop].descriptor) {
          Object.defineProperty(obj, prop, listeners[prop].descriptor);
        } else {
          var curval = obj[prop];
          delete obj[prop];
          obj[prop] = curval;
        }
        delete listeners[prop];
      }
    }
  }
}

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RlcGhlbi9jb2RlL3N0ZXBoZW5idW5jaC9wYXRoeS9zcmMvUGF0aC5qcyIsIi9Vc2Vycy9zdGVwaGVuL2NvZGUvc3RlcGhlbmJ1bmNoL3BhdGh5L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9zdGVwaGVuL2NvZGUvc3RlcGhlbmJ1bmNoL3BhdGh5L3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs2RENNTyxRQUFROztJQUVNLElBQUk7QUFDWixXQURRLElBQUksQ0FDVixJQUFJLEVBQUc7MEJBREQsSUFBSTs7QUFFckIsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDbEIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0dBQy9COztlQUprQixJQUFJOztXQU1mLGtCQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUc7QUFDMUIsVUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDN0IsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O0FBRTNCLGdCQUFVLEdBQUcsK0NBakJmLE1BQU0sQ0FpQmdCO0FBQ2xCLGtCQUFVLEVBQUUsSUFBSTtBQUNoQixvQkFBWSxFQUFFLElBQUk7QUFDbEIsZUFBTyxFQUFFLEtBQUs7QUFDZCxrQkFBVSxFQUFFLElBQUk7T0FDakIsRUFBRSxVQUFVLENBQUUsQ0FBQzs7QUFFaEIsVUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUNqQyxVQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0FB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ZUFBTyxTQUFTLENBQUUsSUFBSSxDQUFFLENBQUM7T0FDMUI7S0FDRjtHQUNGO0NBQ0YiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtcbiAgZm9yRWFjaCxcbiAgZXh0ZW5kLFxuICBvdmVycmlkZVByb3BlcnR5LFxuICB3YXRjaCxcbiAgdW53YXRjaFxufSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRoIHtcbiAgY29uc3RydWN0b3IoIHBhdGggKSB7XG4gICAgdGhpcy52YWx1ZSA9IHBhdGg7XG4gICAgdGhpcy5wYXRoID0gcGF0aC5zcGxpdCggJy4nICk7XG4gIH1cblxuICBvdmVycmlkZSggb2JqLCBkZXNjcmlwdG9yICkge1xuICAgIHZhciBvdmVycmlkZXMgPSBbeyB2YWx1ZTogb2JqIH1dO1xuICAgIHZhciBwYXRoID0gdGhpcy5wYXRoLnNsaWNlKCk7XG4gICAgdmFyIGxhc3QgPSBwYXRoLmxlbmd0aCAtIDE7XG5cbiAgICBkZXNjcmlwdG9yID0gZXh0ZW5kKHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBwZXJzaXN0OiBmYWxzZSxcbiAgICAgIGluaXRpYWxpemU6IHRydWVcbiAgICB9LCBkZXNjcmlwdG9yICk7XG5cbiAgICB2YXIgcGVyc2lzdCA9IGRlc2NyaXB0b3IucGVyc2lzdDtcbiAgICB2YXIgaW5pdGlhbGl6ZSA9IGRlc2NyaXB0b3IuaW5pdGlhbGl6ZTtcbiAgICBkZWxldGUgZGVzY3JpcHRvci5wZXJzaXN0O1xuICAgIGRlbGV0ZSBkZXNjcmlwdG9yLmluaXRpYWxpemU7XG5cbiAgICBmdW5jdGlvbiBzZXR1cCggcG9zaXRpb24gKSB7XG4gICAgICBmb3JFYWNoKCBwYXRoLCBmdW5jdGlvbiggcHJvcCwgaW5kZXggKSB7XG4gICAgICAgIGlmICggaW5kZXggPCBwb3NpdGlvbiApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2JqID0gb3ZlcnJpZGVzWyBpbmRleCBdLnZhbHVlO1xuICAgICAgICB2YXIgb3ZlcnJpZGUgPSB7fTtcbiAgICAgICAgb3ZlcnJpZGVzLnB1c2goIG92ZXJyaWRlICk7XG5cbiAgICAgICAgaWYgKCBpbmRleCA9PT0gbGFzdCApIHtcbiAgICAgICAgICB2YXIgcHJvcGVydHkgPSBvdmVycmlkZVByb3BlcnR5KCBvYmosIHByb3AsIGRlc2NyaXB0b3IgKTtcbiAgICAgICAgICBvdmVycmlkZS5yZXN0b3JlID0gcHJvcGVydHkucmVzdG9yZTtcbiAgICAgICAgICBpZiAoIGluaXRpYWxpemUgJiYgISFkZXNjcmlwdG9yLnNldCApIHtcbiAgICAgICAgICAgIG9ialsgcHJvcCBdID0gcHJvcGVydHkuJHN1cGVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG92ZXJyaWRlLnZhbHVlID0gb2JqWyBwcm9wIF07XG4gICAgICAgICAgb3ZlcnJpZGUucmVzdG9yZSA9IHdhdGNoKCBvYmosIHByb3AsIGZ1bmN0aW9uKCBlICkge1xuICAgICAgICAgICAgb3ZlcnJpZGUudmFsdWUgPSBlLm5ld3ZhbDtcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGUub2xkdmFsID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgICAgICAgcmVzdG9yZSggaW5kZXggKyAxICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBlLm5ld3ZhbCA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICAgIHNldHVwKCBpbmRleCArIDEgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoIHR5cGVvZiBvdmVycmlkZS52YWx1ZSAhPT0gJ29iamVjdCcgfHwgb3ZlcnJpZGUudmFsdWUgPT09IG51bGwgKSB7XG4gICAgICAgICAgICBpZiAoICFwZXJzaXN0ICkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvdmVycmlkZS52YWx1ZSA9IG9ialsgcHJvcCBdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXN0b3JlKCBwb3NpdGlvbiApIHtcbiAgICAgIG92ZXJyaWRlcy5zcGxpY2UoIHBvc2l0aW9uICsgMSApLnJldmVyc2UoKS5mb3JFYWNoKCBmdW5jdGlvbiggb3ZlcnJpZGUgKSB7XG4gICAgICAgIG92ZXJyaWRlLnJlc3RvcmUoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldHVwKCAwICk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmVzdG9yZSggMCApO1xuICAgIH07XG4gIH1cblxuICB3YXRjaCggb2JqLCBsaXN0ZW5lciApIHtcbiAgICB2YXIgY3VydmFsO1xuICAgIHZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHZhciByZXN0b3JlRnVuYyA9IHRoaXMub3ZlcnJpZGUoIG9iaiwge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHN1cGVyKCk7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiggdmFsdWUgKSB7XG4gICAgICAgIGlmICggIWluaXRpYWxpemVkICkge1xuICAgICAgICAgIGN1cnZhbCA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gdGhpcy4kc3VwZXIoIHZhbHVlICk7XG4gICAgICAgICAgaWYgKCB2YWx1ZSAhPT0gY3VydmFsICkge1xuICAgICAgICAgICAgdmFyIG9sZHZhbCA9IGN1cnZhbDtcbiAgICAgICAgICAgIGN1cnZhbCA9IHZhbHVlO1xuICAgICAgICAgICAgbGlzdGVuZXIuY2FsbCggdW5kZWZpbmVkLCB7XG4gICAgICAgICAgICAgIG9sZHZhbDogb2xkdmFsLFxuICAgICAgICAgICAgICBuZXd2YWw6IHZhbHVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgcmV0dXJuIHJlc3RvcmVGdW5jO1xuICB9XG5cbiAgZ2V0KCBvYmogKSB7XG4gICAgaWYgKCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogPT09IG51bGwgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciByZXQgPSBvYmo7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsYXN0SW5kZXggPSB0aGlzLnBhdGgubGVuZ3RoIC0gMTtcbiAgICBmb3IgKCA7IGkgPCBsYXN0SW5kZXg7IGkrKyApIHtcbiAgICAgIHJldCA9IHJldFsgdGhpcy5wYXRoWyBpIF0gXTtcbiAgICAgIGlmICggdHlwZW9mIHJldCAhPT0gJ29iamVjdCcgfHwgcmV0ID09PSBudWxsICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldCAmJiByZXRbIHRoaXMucGF0aFsgbGFzdEluZGV4IF0gXTtcbiAgfVxuXG4gIHNldCggb2JqLCB2YWx1ZSApIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxhc3RJbmRleCA9IHRoaXMucGF0aC5sZW5ndGggLSAxO1xuICAgIGZvciAoIDsgaSA8IGxhc3RJbmRleDsgaSsrICkge1xuICAgICAgaWYgKCB0eXBlb2Ygb2JqWyB0aGlzLnBhdGhbIGkgXSBdICE9PSAnb2JqZWN0JyApIHtcbiAgICAgICAgb2JqWyB0aGlzLnBhdGhbIGkgXSBdID0ge307XG4gICAgICB9XG4gICAgICBvYmogPSBvYmpbIHRoaXMucGF0aFsgaSBdIF07XG4gICAgfVxuICAgIG9ialsgdGhpcy5wYXRoWyBsYXN0SW5kZXggXSBdID0gdmFsdWU7XG4gIH1cbn1cbiIsImltcG9ydCBQYXRoIGZyb20gJy4vUGF0aCc7XG5cbmZ1bmN0aW9uIHBhdGhGYWN0b3J5KCAuLi5hcmdzICkge1xuICB2YXIgcGF0aCA9IE9iamVjdC5jcmVhdGUoIFBhdGgucHJvdG90eXBlICk7XG4gIFBhdGgucHJvdG90eXBlLmNvbnN0cnVjdG9yLmFwcGx5KCBwYXRoLCBhcmdzICk7XG4gIHJldHVybiBwYXRoO1xufVxuXG5wYXRoRmFjdG9yeS5QYXRoID0gUGF0aDtcblxuZXhwb3J0IHsgcGF0aEZhY3RvcnkgYXMgZGVmYXVsdCB9O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2goIGFycmF5LCBjYWxsYmFjayApIHtcbiAgdmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7XG4gIGZvciAoIDsgaSA8IGxlbjsgaSsrICkge1xuICAgIGlmICggY2FsbGJhY2suY2FsbCggYXJyYXksIGFycmF5WyBpIF0sIGkgKSA9PT0gZmFsc2UgKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuZCggdGFyZ2V0LCBzb3VyY2UgKSB7XG4gIHNvdXJjZSA9IHNvdXJjZSB8fCB7fTtcbiAgZm9yICggdmFyIHAgaW4gc291cmNlICkge1xuICAgIGlmICggc291cmNlLmhhc093blByb3BlcnR5KCBwICkgKSB7XG4gICAgICB0YXJnZXRbIHAgXSA9IHNvdXJjZVsgcCBdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb3ZlcnJpZGVQcm9wZXJ0eSggb2JqLCBwcm9wLCBkZXNjcmlwdG9yICkge1xuICB2YXIgdmFsdWU7XG4gIHZhciBzdXBlckRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKCBvYmosIHByb3AgKTtcblxuICBpZiAoICFzdXBlckRlc2NyaXB0b3IgfHwgc3VwZXJEZXNjcmlwdG9yLmhhc093blByb3BlcnR5KCAndmFsdWUnICkgKSB7XG4gICAgdmFsdWUgPSBvYmpbIHByb3AgXTtcbiAgfVxuXG4gIHZhciBzdXBlckdldCA9XG4gICAgc3VwZXJEZXNjcmlwdG9yICYmXG4gICAgc3VwZXJEZXNjcmlwdG9yLmdldCAmJlxuICAgIHN1cGVyRGVzY3JpcHRvci5nZXQuYmluZCggb2JqICkgfHxcbiAgICBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gIHZhciBzdXBlclNldCA9XG4gICAgc3VwZXJEZXNjcmlwdG9yICYmXG4gICAgc3VwZXJEZXNjcmlwdG9yLnNldCAmJlxuICAgIHN1cGVyRGVzY3JpcHRvci5zZXQuYmluZCggb2JqICkgfHxcbiAgICBmdW5jdGlvbiggbmV3dmFsICkge1xuICAgICAgdmFsdWUgPSBuZXd2YWw7XG4gICAgfTtcblxuICBmdW5jdGlvbiAkc3VwZXIoIG5ld3ZhbCApIHtcbiAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggKSB7XG4gICAgICBzdXBlclNldCggbmV3dmFsICk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlckdldCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gb3ZlcnJpZGUoIGFjY2Vzc29yICkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXQ7XG4gICAgICBpZiAoIHRoaXMuaGFzT3duUHJvcGVydHkoICckc3VwZXInICkgKSB7XG4gICAgICAgIHZhciBfc3VwZXIgPSB0aGlzLiRzdXBlcjtcbiAgICAgICAgdGhpcy4kc3VwZXIgPSAkc3VwZXI7XG4gICAgICAgIHJldCA9IGFjY2Vzc29yLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgICAgdGhpcy4kc3VwZXIgPSBfc3VwZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiRzdXBlciA9ICRzdXBlcjtcbiAgICAgICAgcmV0ID0gYWNjZXNzb3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICBkZWxldGUgdGhpcy4kc3VwZXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH07XG4gIH1cblxuICB2YXIgb3ZlcnJpZGVHZXQgPSBkZXNjcmlwdG9yLmdldCAmJiBvdmVycmlkZSggZGVzY3JpcHRvci5nZXQgKTtcbiAgdmFyIG92ZXJyaWRlU2V0ID0gZGVzY3JpcHRvci5zZXQgJiYgb3ZlcnJpZGUoIGRlc2NyaXB0b3Iuc2V0ICk7XG5cbiAgdmFyIGRlZmluaXRpb24gPSBleHRlbmQoIHt9LCBkZXNjcmlwdG9yICk7XG5cbiAgZGVmaW5pdGlvbi5nZXQgPSBkZWZpbml0aW9uLmdldCAmJiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gb3ZlcnJpZGVHZXQgPyBvdmVycmlkZUdldC5jYWxsKCB0aGlzICkgOiBzdXBlckdldCgpO1xuICB9IHx8IHVuZGVmaW5lZDtcblxuICBkZWZpbml0aW9uLnNldCA9IGRlZmluaXRpb24uc2V0ICYmIGZ1bmN0aW9uKCBuZXd2YWwgKSB7XG4gICAgb3ZlcnJpZGVTZXQgPyBvdmVycmlkZVNldC5jYWxsKCB0aGlzLCBuZXd2YWwgKSA6IHN1cGVyU2V0KCBuZXd2YWwgKTtcbiAgfSB8fCB1bmRlZmluZWQ7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBvYmosIHByb3AsIGRlZmluaXRpb24gKTtcblxuICByZXR1cm4ge1xuICAgICRzdXBlcjogJHN1cGVyLFxuICAgIHJlc3RvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCBzdXBlckRlc2NyaXB0b3IgKSB7XG4gICAgICAgIGlmICggc3VwZXJEZXNjcmlwdG9yLmhhc093blByb3BlcnR5KCAndmFsdWUnICkgKSB7XG4gICAgICAgICAgc3VwZXJEZXNjcmlwdG9yLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBvYmosIHByb3AsIHN1cGVyRGVzY3JpcHRvciApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGN1cnZhbCA9IG9ialsgcHJvcCBdO1xuICAgICAgICBkZWxldGUgb2JqWyBwcm9wIF07XG4gICAgICAgIG9ialsgcHJvcCBdID0gY3VydmFsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhdGNoKCBvYmosIHByb3AsIGxpc3RlbmVyICkge1xuICBpZiAoICFvYmouaGFzT3duUHJvcGVydHkoICckJHBhdGhMaXN0ZW5lcnMnICkgKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBvYmosICckJHBhdGhMaXN0ZW5lcnMnLCB7XG4gICAgICB2YWx1ZToge30sXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSBvYmouJCRwYXRoTGlzdGVuZXJzO1xuICBpZiAoICFsaXN0ZW5lcnNbIHByb3AgXSApIHtcbiAgICBsaXN0ZW5lcnNbIHByb3AgXSA9IFtdO1xuICAgIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciggb2JqLCBwcm9wICk7XG4gICAgbGlzdGVuZXJzWyBwcm9wIF0uZGVzY3JpcHRvciA9IGRlc2NyaXB0b3I7XG5cbiAgICB2YXIgdmFsdWU7XG4gICAgdmFyIHN1cGVyR2V0ID0gZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLmdldDtcbiAgICB2YXIgc3VwZXJTZXQgPSBkZXNjcmlwdG9yICYmIGRlc2NyaXB0b3Iuc2V0O1xuICAgIGlmICggIXN1cGVyR2V0ICkge1xuICAgICAgdmFsdWUgPSBvYmpbIHByb3AgXTtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgcHJvcCwge1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdXBlckdldCA/IHN1cGVyR2V0KCkgOiB2YWx1ZTtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKCBuZXd2YWwgKSB7XG4gICAgICAgIHZhciBjdXJ2YWwgPSBvYmpbIHByb3AgXTtcbiAgICAgICAgaWYgKCBzdXBlclNldCApIHtcbiAgICAgICAgICBzdXBlclNldCggbmV3dmFsICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBuZXd2YWw7XG4gICAgICAgIH1cbiAgICAgICAgbmV3dmFsID0gb2JqWyBwcm9wIF07XG4gICAgICAgIGlmICggY3VydmFsICE9PSBuZXd2YWwgKSB7XG4gICAgICAgICAgbGlzdGVuZXJzWyBwcm9wIF0uZm9yRWFjaCggZnVuY3Rpb24oIGxpc3RlbmVyICkge1xuICAgICAgICAgICAgbGlzdGVuZXIoe1xuICAgICAgICAgICAgICBvbGR2YWw6IGN1cnZhbCxcbiAgICAgICAgICAgICAgbmV3dmFsOiBuZXd2YWxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBsaXN0ZW5lcnNbIHByb3AgXS5wdXNoKCBsaXN0ZW5lciApO1xuICByZXR1cm4gdW53YXRjaC5iaW5kKCB1bmRlZmluZWQsIG9iaiwgcHJvcCwgbGlzdGVuZXIgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVud2F0Y2goIG9iaiwgcHJvcCwgbGlzdGVuZXIgKSB7XG4gIHZhciBsaXN0ZW5lcnMgPSBvYmouJCRwYXRoTGlzdGVuZXJzO1xuICBpZiAoIGxpc3RlbmVycyAmJiBsaXN0ZW5lcnNbIHByb3AgXSApIHtcbiAgICB2YXIgaW5kZXggPSBsaXN0ZW5lcnNbIHByb3AgXS5pbmRleE9mKCBsaXN0ZW5lciApO1xuICAgIGlmICggaW5kZXggPiAtMSApIHtcbiAgICAgIGxpc3RlbmVyc1sgcHJvcCBdLnNwbGljZSggaW5kZXgsIDEgKTtcbiAgICAgIGlmICggbGlzdGVuZXJzWyBwcm9wIF0ubGVuZ3RoID09PSAwICkge1xuICAgICAgICBpZiAoIGxpc3RlbmVyc1sgcHJvcCBdLmRlc2NyaXB0b3IgKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KCBvYmosIHByb3AsIGxpc3RlbmVyc1sgcHJvcCBdLmRlc2NyaXB0b3IgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgY3VydmFsID0gb2JqWyBwcm9wIF07XG4gICAgICAgICAgZGVsZXRlIG9ialsgcHJvcCBdO1xuICAgICAgICAgIG9ialsgcHJvcCBdID0gY3VydmFsO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBsaXN0ZW5lcnNbIHByb3AgXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==
