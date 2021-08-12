"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = addFile;

var _path = _interopRequireDefault(require("path"));

var _del = _interopRequireDefault(require("del"));

var _commonActionUtils = require("./_common-action-utils");

var _isbinaryfile = require("isbinaryfile");

var fspp = _interopRequireWildcard(require("../fs-promise-proxy"));

async function addFile(data, cfg, plop) {
  const fileDestPath = (0, _commonActionUtils.makeDestPath)(data, cfg, plop);
  const {
    force,
    skipIfExists = false
  } = cfg;

  try {
    // check path
    let destExists = await fspp.fileExists(fileDestPath); // if we are forcing and the file already exists, delete the file

    if (force === true && destExists) {
      await (0, _del.default)([fileDestPath], {
        force
      });
      destExists = false;
    } // we can't create files where one already exists


    if (destExists) {
      if (skipIfExists) {
        return `[SKIPPED] ${fileDestPath} (exists)`;
      }

      throw `File already exists\n -> ${fileDestPath}`;
    } else {
      await fspp.makeDir(_path.default.dirname(fileDestPath));
      const absTemplatePath = cfg.templateFile && _path.default.resolve(plop.getPlopfilePath(), cfg.templateFile) || null;

      if (absTemplatePath != null && (0, _isbinaryfile.isBinaryFileSync)(absTemplatePath)) {
        const rawTemplate = await fspp.readFileRaw(cfg.templateFile);
        await fspp.writeFileRaw(fileDestPath, rawTemplate);
      } else {
        const renderedTemplate = await (0, _commonActionUtils.getRenderedTemplate)(data, cfg, plop);
        const transformedTemplate = await (0, _commonActionUtils.getTransformedTemplate)(renderedTemplate, data, cfg);
        await fspp.writeFile(fileDestPath, transformedTemplate);
      } // keep the executable flags


      if (absTemplatePath != null) {
        const sourceStats = await fspp.stat(absTemplatePath);
        const destStats = await fspp.stat(fileDestPath);
        const executableFlags = sourceStats.mode & (fspp.constants.S_IXUSR | fspp.constants.S_IXGRP | fspp.constants.S_IXOTH);
        await fspp.chmod(fileDestPath, destStats.mode | executableFlags);
      }
    } // return the added file path (relative to the destination path)


    return (0, _commonActionUtils.getRelativeToBasePath)(fileDestPath, plop);
  } catch (err) {
    (0, _commonActionUtils.throwStringifiedError)(err);
  }
}