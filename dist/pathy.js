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
      if (!obj) {
        return;
      }
      var store = obj.$$pathListeners;
      if (!store) {
        Object.defineProperty(obj, '$$pathListeners', {
          value: {},
          configurable: false,
          enumerable: false
        });
        store = obj.$$pathListeners;
      }
      if (!store[this.value]) {
        var listeners = store[this.value] = [];
        var curval;
        var initialized = false;
        var restore = this.override(obj, {
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
                listeners.slice().forEach(function (listener) {
                  listener.call(undefined, value, oldval);
                });
              }
            }
          }
        });
        initialized = true;
        listeners.destroy = (function (path) {
          restore();
          delete store[path];
        }).bind(undefined, this.value);
      }
      store[this.value].push(listener);
    }
  }, {
    key: 'unwatch',
    value: function unwatch(obj, listener) {
      var listeners = obj && obj.$$pathListeners;
      if (listeners && listeners[this.value]) {
        var index = listeners[this.value].indexOf(listener);
        if (index > -1) {
          listeners[this.value].splice(index, 1);
          if (listeners[this.value].length === 0) {
            listeners[this.value].destroy();
          }
        }
      }
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
  if (!obj.hasOwnProperty('$$propListeners')) {
    Object.defineProperty(obj, '$$propListeners', {
      value: {},
      configurable: false,
      enumerable: false
    });
  }

  var listeners = obj.$$propListeners;
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
  var listeners = obj.$$propListeners;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3RlcGhlbi9jb2RlL3N0ZXBoZW5idW5jaC9wYXRoeS9zcmMvUGF0aC5qcyIsIi9Vc2Vycy9zdGVwaGVuL2NvZGUvc3RlcGhlbmJ1bmNoL3BhdGh5L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9zdGVwaGVuL2NvZGUvc3RlcGhlbmJ1bmNoL3BhdGh5L3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs2RENNTyxRQUFROztJQUVNLElBQUk7QUFDWixXQURRLElBQUksQ0FDVixJQUFJLEVBQUc7MEJBREQsSUFBSTs7QUFFckIsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDbEIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBRSxDQUFDO0dBQy9COztlQUprQixJQUFJOztXQU1mLGtCQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUc7QUFDMUIsVUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDN0IsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O0FBRTNCLGdCQUFVLEdBQUcsK0NBakJmLE1BQU0sQ0FpQmdCO0FBQ2xCLGtCQUFVLEVBQUUsSUFBSTtBQUNoQixvQkFBWSxFQUFFLElBQUk7QUFDbEIsZUFBTyxFQUFFLEtBQUs7QUFDZCxrQkFBVSxFQUFFLElBQUk7T0FDakIsRUFBRSxVQUFVLENBQUUsQ0FBQzs7QUFFaEIsVUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUNqQyxVQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0FB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LGdCQUFNLENBQUMsY0FBYyxDQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFFLElBQUksQ0FBRSxDQUFDLFVBQVUsQ0FBRSxDQUFDO1NBQ2xFLE1BQU07QUFDTCxjQUFJLE1BQU0sR0FBRyxHQUFHLENBQUUsSUFBSSxDQUFFLENBQUM7QUFDekIsaUJBQU8sR0FBRyxDQUFFLElBQUksQ0FBRSxDQUFDO0FBQ25CLGFBQUcsQ0FBRSxJQUFJLENBQUUsR0FBRyxNQUFNLENBQUM7U0FDdEI7QUFDRCxlQUFPLFNBQVMsQ0FBRSxJQUFJLENBQUUsQ0FBQztPQUMxQjtLQUNGO0dBQ0Y7Q0FDRiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge1xuICBmb3JFYWNoLFxuICBleHRlbmQsXG4gIG92ZXJyaWRlUHJvcGVydHksXG4gIHdhdGNoLFxuICB1bndhdGNoXG59IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdGgge1xuICBjb25zdHJ1Y3RvciggcGF0aCApIHtcbiAgICB0aGlzLnZhbHVlID0gcGF0aDtcbiAgICB0aGlzLnBhdGggPSBwYXRoLnNwbGl0KCAnLicgKTtcbiAgfVxuXG4gIG92ZXJyaWRlKCBvYmosIGRlc2NyaXB0b3IgKSB7XG4gICAgdmFyIG92ZXJyaWRlcyA9IFt7IHZhbHVlOiBvYmogfV07XG4gICAgdmFyIHBhdGggPSB0aGlzLnBhdGguc2xpY2UoKTtcbiAgICB2YXIgbGFzdCA9IHBhdGgubGVuZ3RoIC0gMTtcblxuICAgIGRlc2NyaXB0b3IgPSBleHRlbmQoe1xuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHBlcnNpc3Q6IGZhbHNlLFxuICAgICAgaW5pdGlhbGl6ZTogdHJ1ZVxuICAgIH0sIGRlc2NyaXB0b3IgKTtcblxuICAgIHZhciBwZXJzaXN0ID0gZGVzY3JpcHRvci5wZXJzaXN0O1xuICAgIHZhciBpbml0aWFsaXplID0gZGVzY3JpcHRvci5pbml0aWFsaXplO1xuICAgIGRlbGV0ZSBkZXNjcmlwdG9yLnBlcnNpc3Q7XG4gICAgZGVsZXRlIGRlc2NyaXB0b3IuaW5pdGlhbGl6ZTtcblxuICAgIGZ1bmN0aW9uIHNldHVwKCBwb3NpdGlvbiApIHtcbiAgICAgIGZvckVhY2goIHBhdGgsIGZ1bmN0aW9uKCBwcm9wLCBpbmRleCApIHtcbiAgICAgICAgaWYgKCBpbmRleCA8IHBvc2l0aW9uICkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvYmogPSBvdmVycmlkZXNbIGluZGV4IF0udmFsdWU7XG4gICAgICAgIHZhciBvdmVycmlkZSA9IHt9O1xuICAgICAgICBvdmVycmlkZXMucHVzaCggb3ZlcnJpZGUgKTtcblxuICAgICAgICBpZiAoIGluZGV4ID09PSBsYXN0ICkge1xuICAgICAgICAgIHZhciBwcm9wZXJ0eSA9IG92ZXJyaWRlUHJvcGVydHkoIG9iaiwgcHJvcCwgZGVzY3JpcHRvciApO1xuICAgICAgICAgIG92ZXJyaWRlLnJlc3RvcmUgPSBwcm9wZXJ0eS5yZXN0b3JlO1xuICAgICAgICAgIGlmICggaW5pdGlhbGl6ZSAmJiAhIWRlc2NyaXB0b3Iuc2V0ICkge1xuICAgICAgICAgICAgb2JqWyBwcm9wIF0gPSBwcm9wZXJ0eS4kc3VwZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3ZlcnJpZGUudmFsdWUgPSBvYmpbIHByb3AgXTtcbiAgICAgICAgICBvdmVycmlkZS5yZXN0b3JlID0gd2F0Y2goIG9iaiwgcHJvcCwgZnVuY3Rpb24oIGUgKSB7XG4gICAgICAgICAgICBvdmVycmlkZS52YWx1ZSA9IGUubmV3dmFsO1xuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZS5vbGR2YWwgPT09ICdvYmplY3QnICkge1xuICAgICAgICAgICAgICByZXN0b3JlKCBpbmRleCArIDEgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICggdHlwZW9mIGUubmV3dmFsID09PSAnb2JqZWN0JyApIHtcbiAgICAgICAgICAgICAgc2V0dXAoIGluZGV4ICsgMSApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICggdHlwZW9mIG92ZXJyaWRlLnZhbHVlICE9PSAnb2JqZWN0JyB8fCBvdmVycmlkZS52YWx1ZSA9PT0gbnVsbCApIHtcbiAgICAgICAgICAgIGlmICggIXBlcnNpc3QgKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG92ZXJyaWRlLnZhbHVlID0gb2JqWyBwcm9wIF0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc3RvcmUoIHBvc2l0aW9uICkge1xuICAgICAgb3ZlcnJpZGVzLnNwbGljZSggcG9zaXRpb24gKyAxICkucmV2ZXJzZSgpLmZvckVhY2goIGZ1bmN0aW9uKCBvdmVycmlkZSApIHtcbiAgICAgICAgb3ZlcnJpZGUucmVzdG9yZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0dXAoIDAgKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXN0b3JlKCAwICk7XG4gICAgfTtcbiAgfVxuXG4gIHdhdGNoKCBvYmosIGxpc3RlbmVyICkge1xuICAgIGlmICggIW9iaiApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHN0b3JlID0gb2JqLiQkcGF0aExpc3RlbmVycztcbiAgICBpZiAoICFzdG9yZSApIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggb2JqLCAnJCRwYXRoTGlzdGVuZXJzJywge1xuICAgICAgICB2YWx1ZToge30sXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICAgIHN0b3JlID0gb2JqLiQkcGF0aExpc3RlbmVycztcbiAgICB9XG4gICAgaWYgKCAhc3RvcmVbIHRoaXMudmFsdWUgXSApIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBzdG9yZVsgdGhpcy52YWx1ZSBdID0gW107XG4gICAgICB2YXIgY3VydmFsO1xuICAgICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICB2YXIgcmVzdG9yZSA9IHRoaXMub3ZlcnJpZGUoIG9iaiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLiRzdXBlcigpO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKCB2YWx1ZSApIHtcbiAgICAgICAgICBpZiAoICFpbml0aWFsaXplZCApIHtcbiAgICAgICAgICAgIGN1cnZhbCA9IHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuJHN1cGVyKCB2YWx1ZSApO1xuICAgICAgICAgICAgaWYgKCB2YWx1ZSAhPT0gY3VydmFsICkge1xuICAgICAgICAgICAgICB2YXIgb2xkdmFsID0gY3VydmFsO1xuICAgICAgICAgICAgICBjdXJ2YWwgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgbGlzdGVuZXJzLnNsaWNlKCkuZm9yRWFjaCggZnVuY3Rpb24oIGxpc3RlbmVyICkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwoIHVuZGVmaW5lZCwgdmFsdWUsIG9sZHZhbCApO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXJzLmRlc3Ryb3kgPSAoIGZ1bmN0aW9uKCBwYXRoICkge1xuICAgICAgICByZXN0b3JlKCk7XG4gICAgICAgIGRlbGV0ZSBzdG9yZVsgcGF0aCBdO1xuICAgICAgfSkuYmluZCggdW5kZWZpbmVkLCB0aGlzLnZhbHVlICk7XG4gICAgfVxuICAgIHN0b3JlWyB0aGlzLnZhbHVlIF0ucHVzaCggbGlzdGVuZXIgKTtcbiAgfVxuXG4gIHVud2F0Y2goIG9iaiwgbGlzdGVuZXIgKSB7XG4gICAgdmFyIGxpc3RlbmVycyA9IG9iaiAmJiBvYmouJCRwYXRoTGlzdGVuZXJzO1xuICAgIGlmICggbGlzdGVuZXJzICYmIGxpc3RlbmVyc1sgdGhpcy52YWx1ZSBdICkge1xuICAgICAgdmFyIGluZGV4ID0gbGlzdGVuZXJzWyB0aGlzLnZhbHVlIF0uaW5kZXhPZiggbGlzdGVuZXIgKTtcbiAgICAgIGlmICggaW5kZXggPiAtMSApIHtcbiAgICAgICAgbGlzdGVuZXJzWyB0aGlzLnZhbHVlIF0uc3BsaWNlKCBpbmRleCwgMSApO1xuICAgICAgICBpZiAoIGxpc3RlbmVyc1sgdGhpcy52YWx1ZSBdLmxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbIHRoaXMudmFsdWUgXS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXQoIG9iaiApIHtcbiAgICBpZiAoIHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiA9PT0gbnVsbCApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHJldCA9IG9iajtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxhc3RJbmRleCA9IHRoaXMucGF0aC5sZW5ndGggLSAxO1xuICAgIGZvciAoIDsgaSA8IGxhc3RJbmRleDsgaSsrICkge1xuICAgICAgcmV0ID0gcmV0WyB0aGlzLnBhdGhbIGkgXSBdO1xuICAgICAgaWYgKCB0eXBlb2YgcmV0ICE9PSAnb2JqZWN0JyB8fCByZXQgPT09IG51bGwgKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0ICYmIHJldFsgdGhpcy5wYXRoWyBsYXN0SW5kZXggXSBdO1xuICB9XG5cbiAgc2V0KCBvYmosIHZhbHVlICkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGFzdEluZGV4ID0gdGhpcy5wYXRoLmxlbmd0aCAtIDE7XG4gICAgZm9yICggOyBpIDwgbGFzdEluZGV4OyBpKysgKSB7XG4gICAgICBpZiAoIHR5cGVvZiBvYmpbIHRoaXMucGF0aFsgaSBdIF0gIT09ICdvYmplY3QnICkge1xuICAgICAgICBvYmpbIHRoaXMucGF0aFsgaSBdIF0gPSB7fTtcbiAgICAgIH1cbiAgICAgIG9iaiA9IG9ialsgdGhpcy5wYXRoWyBpIF0gXTtcbiAgICB9XG4gICAgb2JqWyB0aGlzLnBhdGhbIGxhc3RJbmRleCBdIF0gPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IFBhdGggZnJvbSAnLi9QYXRoJztcblxuZnVuY3Rpb24gcGF0aEZhY3RvcnkoIC4uLmFyZ3MgKSB7XG4gIHZhciBwYXRoID0gT2JqZWN0LmNyZWF0ZSggUGF0aC5wcm90b3R5cGUgKTtcbiAgUGF0aC5wcm90b3R5cGUuY29uc3RydWN0b3IuYXBwbHkoIHBhdGgsIGFyZ3MgKTtcbiAgcmV0dXJuIHBhdGg7XG59XG5cbnBhdGhGYWN0b3J5LlBhdGggPSBQYXRoO1xuXG5leHBvcnQgeyBwYXRoRmFjdG9yeSBhcyBkZWZhdWx0IH07XG4iLCJleHBvcnQgZnVuY3Rpb24gZm9yRWFjaCggYXJyYXksIGNhbGxiYWNrICkge1xuICB2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDtcbiAgZm9yICggOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgaWYgKCBjYWxsYmFjay5jYWxsKCBhcnJheSwgYXJyYXlbIGkgXSwgaSApID09PSBmYWxzZSApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kKCB0YXJnZXQsIHNvdXJjZSApIHtcbiAgc291cmNlID0gc291cmNlIHx8IHt9O1xuICBmb3IgKCB2YXIgcCBpbiBzb3VyY2UgKSB7XG4gICAgaWYgKCBzb3VyY2UuaGFzT3duUHJvcGVydHkoIHAgKSApIHtcbiAgICAgIHRhcmdldFsgcCBdID0gc291cmNlWyBwIF07XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvdmVycmlkZVByb3BlcnR5KCBvYmosIHByb3AsIGRlc2NyaXB0b3IgKSB7XG4gIHZhciB2YWx1ZTtcbiAgdmFyIHN1cGVyRGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoIG9iaiwgcHJvcCApO1xuXG4gIGlmICggIXN1cGVyRGVzY3JpcHRvciB8fCBzdXBlckRlc2NyaXB0b3IuaGFzT3duUHJvcGVydHkoICd2YWx1ZScgKSApIHtcbiAgICB2YWx1ZSA9IG9ialsgcHJvcCBdO1xuICB9XG5cbiAgdmFyIHN1cGVyR2V0ID1cbiAgICBzdXBlckRlc2NyaXB0b3IgJiZcbiAgICBzdXBlckRlc2NyaXB0b3IuZ2V0ICYmXG4gICAgc3VwZXJEZXNjcmlwdG9yLmdldC5iaW5kKCBvYmogKSB8fFxuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgdmFyIHN1cGVyU2V0ID1cbiAgICBzdXBlckRlc2NyaXB0b3IgJiZcbiAgICBzdXBlckRlc2NyaXB0b3Iuc2V0ICYmXG4gICAgc3VwZXJEZXNjcmlwdG9yLnNldC5iaW5kKCBvYmogKSB8fFxuICAgIGZ1bmN0aW9uKCBuZXd2YWwgKSB7XG4gICAgICB2YWx1ZSA9IG5ld3ZhbDtcbiAgICB9O1xuXG4gIGZ1bmN0aW9uICRzdXBlciggbmV3dmFsICkge1xuICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCApIHtcbiAgICAgIHN1cGVyU2V0KCBuZXd2YWwgKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyR2V0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBvdmVycmlkZSggYWNjZXNzb3IgKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJldDtcbiAgICAgIGlmICggdGhpcy5oYXNPd25Qcm9wZXJ0eSggJyRzdXBlcicgKSApIHtcbiAgICAgICAgdmFyIF9zdXBlciA9IHRoaXMuJHN1cGVyO1xuICAgICAgICB0aGlzLiRzdXBlciA9ICRzdXBlcjtcbiAgICAgICAgcmV0ID0gYWNjZXNzb3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuICAgICAgICB0aGlzLiRzdXBlciA9IF9zdXBlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHN1cGVyID0gJHN1cGVyO1xuICAgICAgICByZXQgPSBhY2Nlc3Nvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLiRzdXBlcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgfVxuXG4gIHZhciBvdmVycmlkZUdldCA9IGRlc2NyaXB0b3IuZ2V0ICYmIG92ZXJyaWRlKCBkZXNjcmlwdG9yLmdldCApO1xuICB2YXIgb3ZlcnJpZGVTZXQgPSBkZXNjcmlwdG9yLnNldCAmJiBvdmVycmlkZSggZGVzY3JpcHRvci5zZXQgKTtcblxuICB2YXIgZGVmaW5pdGlvbiA9IGV4dGVuZCgge30sIGRlc2NyaXB0b3IgKTtcblxuICBkZWZpbml0aW9uLmdldCA9IGRlZmluaXRpb24uZ2V0ICYmIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBvdmVycmlkZUdldCA/IG92ZXJyaWRlR2V0LmNhbGwoIHRoaXMgKSA6IHN1cGVyR2V0KCk7XG4gIH0gfHwgdW5kZWZpbmVkO1xuXG4gIGRlZmluaXRpb24uc2V0ID0gZGVmaW5pdGlvbi5zZXQgJiYgZnVuY3Rpb24oIG5ld3ZhbCApIHtcbiAgICBvdmVycmlkZVNldCA/IG92ZXJyaWRlU2V0LmNhbGwoIHRoaXMsIG5ld3ZhbCApIDogc3VwZXJTZXQoIG5ld3ZhbCApO1xuICB9IHx8IHVuZGVmaW5lZDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgcHJvcCwgZGVmaW5pdGlvbiApO1xuXG4gIHJldHVybiB7XG4gICAgJHN1cGVyOiAkc3VwZXIsXG4gICAgcmVzdG9yZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIHN1cGVyRGVzY3JpcHRvciApIHtcbiAgICAgICAgaWYgKCBzdXBlckRlc2NyaXB0b3IuaGFzT3duUHJvcGVydHkoICd2YWx1ZScgKSApIHtcbiAgICAgICAgICBzdXBlckRlc2NyaXB0b3IudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgcHJvcCwgc3VwZXJEZXNjcmlwdG9yICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY3VydmFsID0gb2JqWyBwcm9wIF07XG4gICAgICAgIGRlbGV0ZSBvYmpbIHByb3AgXTtcbiAgICAgICAgb2JqWyBwcm9wIF0gPSBjdXJ2YWw7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2F0Y2goIG9iaiwgcHJvcCwgbGlzdGVuZXIgKSB7XG4gIGlmICggIW9iai5oYXNPd25Qcm9wZXJ0eSggJyQkcHJvcExpc3RlbmVycycgKSApIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgJyQkcHJvcExpc3RlbmVycycsIHtcbiAgICAgIHZhbHVlOiB7fSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IG9iai4kJHByb3BMaXN0ZW5lcnM7XG4gIGlmICggIWxpc3RlbmVyc1sgcHJvcCBdICkge1xuICAgIGxpc3RlbmVyc1sgcHJvcCBdID0gW107XG4gICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKCBvYmosIHByb3AgKTtcbiAgICBsaXN0ZW5lcnNbIHByb3AgXS5kZXNjcmlwdG9yID0gZGVzY3JpcHRvcjtcblxuICAgIHZhciB2YWx1ZTtcbiAgICB2YXIgc3VwZXJHZXQgPSBkZXNjcmlwdG9yICYmIGRlc2NyaXB0b3IuZ2V0O1xuICAgIHZhciBzdXBlclNldCA9IGRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci5zZXQ7XG4gICAgaWYgKCAhc3VwZXJHZXQgKSB7XG4gICAgICB2YWx1ZSA9IG9ialsgcHJvcCBdO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSggb2JqLCBwcm9wLCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyR2V0ID8gc3VwZXJHZXQoKSA6IHZhbHVlO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24oIG5ld3ZhbCApIHtcbiAgICAgICAgdmFyIGN1cnZhbCA9IG9ialsgcHJvcCBdO1xuICAgICAgICBpZiAoIHN1cGVyU2V0ICkge1xuICAgICAgICAgIHN1cGVyU2V0KCBuZXd2YWwgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA9IG5ld3ZhbDtcbiAgICAgICAgfVxuICAgICAgICBuZXd2YWwgPSBvYmpbIHByb3AgXTtcbiAgICAgICAgaWYgKCBjdXJ2YWwgIT09IG5ld3ZhbCApIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbIHByb3AgXS5mb3JFYWNoKCBmdW5jdGlvbiggbGlzdGVuZXIgKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcih7XG4gICAgICAgICAgICAgIG9sZHZhbDogY3VydmFsLFxuICAgICAgICAgICAgICBuZXd2YWw6IG5ld3ZhbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGxpc3RlbmVyc1sgcHJvcCBdLnB1c2goIGxpc3RlbmVyICk7XG4gIHJldHVybiB1bndhdGNoLmJpbmQoIHVuZGVmaW5lZCwgb2JqLCBwcm9wLCBsaXN0ZW5lciApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW53YXRjaCggb2JqLCBwcm9wLCBsaXN0ZW5lciApIHtcbiAgdmFyIGxpc3RlbmVycyA9IG9iai4kJHByb3BMaXN0ZW5lcnM7XG4gIGlmICggbGlzdGVuZXJzICYmIGxpc3RlbmVyc1sgcHJvcCBdICkge1xuICAgIHZhciBpbmRleCA9IGxpc3RlbmVyc1sgcHJvcCBdLmluZGV4T2YoIGxpc3RlbmVyICk7XG4gICAgaWYgKCBpbmRleCA+IC0xICkge1xuICAgICAgbGlzdGVuZXJzWyBwcm9wIF0uc3BsaWNlKCBpbmRleCwgMSApO1xuICAgICAgaWYgKCBsaXN0ZW5lcnNbIHByb3AgXS5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgIGlmICggbGlzdGVuZXJzWyBwcm9wIF0uZGVzY3JpcHRvciApIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoIG9iaiwgcHJvcCwgbGlzdGVuZXJzWyBwcm9wIF0uZGVzY3JpcHRvciApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBjdXJ2YWwgPSBvYmpbIHByb3AgXTtcbiAgICAgICAgICBkZWxldGUgb2JqWyBwcm9wIF07XG4gICAgICAgICAgb2JqWyBwcm9wIF0gPSBjdXJ2YWw7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIGxpc3RlbmVyc1sgcHJvcCBdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19
