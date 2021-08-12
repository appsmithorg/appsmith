"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

function _default(action, {
  checkPath = true,
  checkAbortOnFail = true
} = {}) {
  // it's not even an object, you fail!
  if (typeof action !== 'object') {
    return `Invalid action object: ${(0, _stringify.default)(action)}`;
  }

  const {
    path,
    abortOnFail
  } = action;

  if (checkPath && (typeof path !== 'string' || path.length === 0)) {
    return `Invalid path "${path}"`;
  } // abortOnFail is optional, but if it's provided it needs to be a Boolean


  if (checkAbortOnFail && abortOnFail !== undefined && typeof abortOnFail !== 'boolean') {
    return `Invalid value for abortOnFail (${abortOnFail} is not a Boolean)`;
  }

  if ('transform' in action && typeof action.transform !== 'function') {
    return `Invalid value for transform (${typeof action.transform} is not a function)`;
  }

  if (action.type === 'modify' && !('pattern' in action) && !('transform' in action)) {
    return 'Invalid modify action (modify must have a pattern or transform function)';
  }

  if ('skip' in action && typeof action.skip !== 'function') {
    return `Invalid value for skip (${typeof action.skip} is not a function)`;
  }

  return true;
}