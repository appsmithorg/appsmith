var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");

function _initializerDefineProperty(target, property, descriptor, context) {
  if (!descriptor) return;

  _Object$defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

module.exports = _initializerDefineProperty;
module.exports["default"] = module.exports, module.exports.__esModule = true;