var _Reflect$construct = require("@babel/runtime-corejs3/core-js/reflect/construct");

var getPrototypeOf = require("./getPrototypeOf.js");

var isNativeReflectConstruct = require("./isNativeReflectConstruct.js");

var possibleConstructorReturn = require("./possibleConstructorReturn.js");

function _createSuper(Derived) {
  var hasNativeReflectConstruct = isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = getPrototypeOf(this).constructor;
      result = _Reflect$construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return possibleConstructorReturn(this, result);
  };
}

module.exports = _createSuper;
module.exports["default"] = module.exports, module.exports.__esModule = true;