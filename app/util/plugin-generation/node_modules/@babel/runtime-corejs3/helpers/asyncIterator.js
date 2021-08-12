var _Symbol = require("@babel/runtime-corejs3/core-js/symbol");

var _Symbol$asyncIterator = require("@babel/runtime-corejs3/core-js/symbol/async-iterator");

var _Symbol$iterator = require("@babel/runtime-corejs3/core-js/symbol/iterator");

var _getIteratorMethod = require("@babel/runtime-corejs3/core-js/get-iterator-method");

function _asyncIterator(iterable) {
  var method;

  if (typeof _Symbol !== "undefined") {
    if (_Symbol$asyncIterator) method = iterable[_Symbol$asyncIterator];
    if (method == null && _Symbol$iterator) method = _getIteratorMethod(iterable);
  }

  if (method == null) method = iterable["@@asyncIterator"];
  if (method == null) method = iterable["@@iterator"];
  if (method == null) throw new TypeError("Object is not async iterable");
  return method.call(iterable);
}

module.exports = _asyncIterator;
module.exports["default"] = module.exports, module.exports.__esModule = true;