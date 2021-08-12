import _Object$setPrototypeOf from "@babel/runtime-corejs3/core-js/object/set-prototype-of";
import _Object$getPrototypeOf from "@babel/runtime-corejs3/core-js/object/get-prototype-of";
export default function _getPrototypeOf(o) {
  _getPrototypeOf = _Object$setPrototypeOf ? _Object$getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || _Object$getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}