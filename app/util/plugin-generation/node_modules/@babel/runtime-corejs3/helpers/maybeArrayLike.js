var _Array$isArray = require("@babel/runtime-corejs3/core-js/array/is-array");

var arrayLikeToArray = require("./arrayLikeToArray.js");

function _maybeArrayLike(next, arr, i) {
  if (arr && !_Array$isArray(arr) && typeof arr.length === "number") {
    var len = arr.length;
    return arrayLikeToArray(arr, i !== void 0 && i < len ? i : len);
  }

  return next(arr, i);
}

module.exports = _maybeArrayLike;
module.exports["default"] = module.exports, module.exports.__esModule = true;