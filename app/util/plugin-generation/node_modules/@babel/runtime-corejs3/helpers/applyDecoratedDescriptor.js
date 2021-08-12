var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");

var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");

var _reduceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/reduce");

var _reverseInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/reverse");

var _sliceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/slice");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var _context, _context2, _context3;

  var desc = {};

  _forEachInstanceProperty(_context = _Object$keys(descriptor)).call(_context, function (key) {
    desc[key] = descriptor[key];
  });

  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = _reduceInstanceProperty(_context2 = _reverseInstanceProperty(_context3 = _sliceInstanceProperty(decorators).call(decorators)).call(_context3)).call(_context2, function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    _Object$defineProperty(target, property, desc);

    desc = null;
  }

  return desc;
}

module.exports = _applyDecoratedDescriptor;
module.exports["default"] = module.exports, module.exports.__esModule = true;