import _Object$keys from "@babel/runtime-corejs3/core-js/object/keys";
import _Object$getOwnPropertySymbols from "@babel/runtime-corejs3/core-js/object/get-own-property-symbols";
import _concatInstanceProperty from "@babel/runtime-corejs3/core-js/instance/concat";
import _filterInstanceProperty from "@babel/runtime-corejs3/core-js/instance/filter";
import _Object$getOwnPropertyDescriptor from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptor";
import _forEachInstanceProperty from "@babel/runtime-corejs3/core-js/instance/for-each";
import defineProperty from "./defineProperty.js";
export default function _objectSpread(target) {
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