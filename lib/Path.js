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