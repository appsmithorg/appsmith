var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js/object/get-own-property-symbols");

var _concatInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/concat");

var _filterInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/filter");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js/object/get-own-property-descriptor");

var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");

var defineProperty = require("./defineProperty.js");

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? Object(arguments[i]) : {};

    var ownKeys = _Object$keys(source);

    if (typeof _Object$getOwnPropertySymbols === 'function') {
      var _context;

      ownKeys = _concatInstanceProperty(ownKeys).call(ownKeys, _filterInstanceProperty(_context = _Object$getOwnPropertySymbols(source)).call(_context, function (sym) {
        return _Object$getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    _forEachInstanceProperty(ownKeys).call(ownKeys, function (key) {
      defineProperty(target, key, source[key]);
    });
  }

  return target;
}

module.exports = _objectSpread;
module.exports["default"] = module.exports, module.exports.__esModule = true;