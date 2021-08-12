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

const doAppend = async function (data, cfg, plop, fileData) {
  const stringToAppend = await (0, _commonActionUtils.getRenderedTemplate)(data, cfg, plop); // if the appended string should be unique (default),
  // remove any occurence of it (but only if pattern would match)

  const {
    separator = '\n'
  } = cfg;

  if (cfg.unique !== false) {
    // only remove after "pattern", so that we remove not too much accidentally
    const parts = fileData.split(cfg.pattern);
    const lastPart = parts[parts.length - 1];
    const lastPartWithoutDuplicates = lastPart.replace(new RegExp(separator + stringToAppend, 'g'), '');
    fileData = fileData.replace(lastPart, lastPartWithoutDuplicates);
  } // add the appended string to the end of the "fileData" if "pattern"
  // was not provided, i.e. null or false


  if (!cfg.pattern) {
    // make sure to add a "separator" if "fileData" is not empty
    if (fileData.length > 0) {
      fileData += separator;
    }

    return fileData + stringToAppend;
  }

  return fileData.replace(cfg.pattern, '$&' + separator + stringToAppend);
};

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
      fileData = await doAppend(data, cfg, plop, fileData);
      await fspp.writeFile(fileDestPath, fileData);
    }

    return (0, _commonActionUtils.getRelativeToBasePath)(fileDestPath, plop);
  } catch (err) {
    (0, _commonActionUtils.throwStringifiedError)(err);
  }
}