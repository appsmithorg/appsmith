"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var fspp = _interopRequireWildcard(require("../fs-promise-proxy"));

var _commonActionUtils = require("./_common-action-utils");

var _commonActionInterfaceCheck = _interopRequireDefault(require("./_common-action-interface-check"));

async function _default(data, cfg, plop) {
  const interfaceTestResult = (0, _commonActionInterfaceCheck.default)(cfg);

  if (interfaceTestResult !== true) {
    throw interfaceTestResult;
  }

  const fileDestPath = (0, _commonActionUtils.makeDestPath)(data, cfg, plop);

  try {
    // check path
    const pathExists = await fspp.fileExists(fileDestPath);

    if (!pathExists) {
      throw 'File does not exist';
    } else {
      let fileData = await fspp.readFile(fileDestPath);
      cfg.templateFile = (0, _commonActionUtils.getRenderedTemplatePath)(data, cfg, plop);
      const replacement = await (0, _commonActionUtils.getRenderedTemplate)(data, cfg, plop);

      if (typeof cfg.pattern === 'string' || cfg.pattern instanceof RegExp) {
        fileData = fileData.replace(cfg.pattern, replacement);
      }

      const transformed = await (0, _commonActionUtils.getTransformedTemplate)(fileData, data, cfg);
      await fspp.writeFile(fileDestPath, transformed);
    }

    return (0, _commonActionUtils.getRelativeToBasePath)(fileDestPath, plop);
  } catch (err) {
    (0, _commonActionUtils.throwStringifiedError)(err);
  }
}