var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");

var _Object$getOwnPropertySymbols = require("@babel/runtime-corejs3/core-js/object/get-own-property-symbols");

function _defineEnumerableProperties(obj, descs) {
  for (var key in descs) {
    var desc = descs[key];
    desc.configurable = desc.enumerable = true;
    if ("value" in desc) desc.writable = true;

    _Object$defineProperty(obj, key, desc);
  }

  if (_Object$getOwnPropertySymbols) {
    var objectSymbols = _Object$getOwnPropertySymbols(descs);

    for (var i = 0; i < objectSymbols.length; i++) {
      var sym = objectSymbols[i];
      var desc = descs[sym];
      desc.configurable = desc.enumerable = true;
      if ("value" in desc) desc.writable = true;

      _Object$defineProperty(obj, sym, desc);
    }
  }

  return obj;
}

module.exports = _defineEnumerableProperties;
module.exports["default"] = module.exports, module.exports.__esModule = true;