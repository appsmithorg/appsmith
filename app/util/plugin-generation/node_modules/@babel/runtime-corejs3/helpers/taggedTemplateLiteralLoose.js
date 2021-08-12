var _sliceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/slice");

function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = _sliceInstanceProperty(strings).call(strings, 0);
  }

  strings.raw = raw;
  return strings;
}

module.exports = _taggedTemplateLiteralLoose;
module.exports["default"] = module.exports, module.exports.__esModule = true;