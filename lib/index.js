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