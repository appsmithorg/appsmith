var _Symbol = require("@babel/runtime-corejs3/core-js/symbol");

var _getIteratorMethod = require("@babel/runtime-corejs3/core-js/get-iterator-method");

var _bindInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/bind");

var _Array$isArray = require("@babel/runtime-corejs3/core-js/array/is-array");

var unsupportedIterableToArray = require("./unsupportedIterableToArray.js");

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var _context;

  var it = typeof _Symbol !== "undefined" && _getIteratorMethod(o) || o["@@iterator"];
  if (it) return _bindInstanceProperty(_context = (it = it.call(o)).next).call(_context, it);

  if (_Array$isArray(o) || (it = unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }

  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

module.exports = _createForOfIteratorHelperLoose;
module.exports["default"] = module.exports, module.exports.__esModule = true;