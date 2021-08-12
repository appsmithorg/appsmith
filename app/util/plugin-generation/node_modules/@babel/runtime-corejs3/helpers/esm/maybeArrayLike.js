import _Array$isArray from "@babel/runtime-corejs3/core-js/array/is-array";
import arrayLikeToArray from "./arrayLikeToArray.js";
export default function _maybeArrayLike(next, arr, i) {
  if (arr && !_Array$isArray(arr) && typeof arr.length === "number") {
    var len = arr.length;
    return arrayLikeToArray(arr, i !== void 0 && i < len ? i : len);
  }

  return next(arr, i);
}