import _sliceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/slice";
import _Object$freeze from "@babel/runtime-corejs3/core-js/object/freeze";
import _Object$defineProperties from "@babel/runtime-corejs3/core-js/object/define-properties";
export default function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = _sliceInstanceProperty(strings).call(strings, 0);
  }

  return _Object$freeze(_Object$defineProperties(strings, {
    raw: {
      value: _Object$freeze(raw)
    }
  }));
}