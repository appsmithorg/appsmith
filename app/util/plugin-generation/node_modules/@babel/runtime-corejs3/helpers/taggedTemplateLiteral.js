var _sliceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/slice");

var _Object$freeze = require("@babel/runtime-corejs3/core-js/object/freeze");

var _Object$defineProperties = require("@babel/runtime-corejs3/core-js/object/define-properties");

function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = _sliceInstanceProperty(strings).call(strings, 0);
  }

  return _Object$freeze(_Object$defineProperties(strings, {
    raw: {
      value: _Object$freeze(raw)
    }
  }));
}

module.exports = _taggedTemplateLiteral;
module.exports["default"] = module.exports, module.exports.__esModule = true;