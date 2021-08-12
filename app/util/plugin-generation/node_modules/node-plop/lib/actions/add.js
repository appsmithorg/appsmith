"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _commonActionInterfaceCheck = _interopRequireDefault(require("./_common-action-interface-check"));

var _commonActionAddFile = _interopRequireDefault(require("./_common-action-add-file"));

var _commonActionUtils = require("./_common-action-utils");

async function _default(data, cfg, plop) {
  const interfaceTestResult = (0, _commonActionInterfaceCheck.default)(cfg);

  if (interfaceTestResult !== true) {
    throw interfaceTestResult;
  }

  cfg.templateFile = (0, _commonActionUtils.getRenderedTemplatePath)(data, cfg, plop);
  return await (0, _commonActionAddFile.default)(data, cfg, plop);
}