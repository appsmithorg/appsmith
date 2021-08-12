import _sliceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/slice";
export default function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = _sliceInstanceProperty(strings).call(strings, 0);
  }

  strings.raw = raw;
  return strings;
}