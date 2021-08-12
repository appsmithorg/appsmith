"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/is-array"));

var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/starts-with"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _globby = _interopRequireDefault(require("globby"));

var _commonActionInterfaceCheck = _interopRequireDefault(require("./_common-action-interface-check"));

var _commonActionAddFile = _interopRequireDefault(require("./_common-action-add-file"));

var _commonActionUtils = require("./_common-action-utils");

const defaultConfig = {
  verbose: true,
  stripExtensions: ['hbs']
};

async function _default(data, userConfig, plop) {
  var _context, _context2;

  // shallow-merge default config and input config
  const cfg = (0, _assign.default)({}, defaultConfig, userConfig); // check the common action interface attributes. skip path check because it's NA

  const interfaceTestResult = (0, _commonActionInterfaceCheck.default)(cfg, {
    checkPath: false
  });

  if (interfaceTestResult !== true) {
    throw interfaceTestResult;
  } // check that destination (instead of path) is a string value


  const dest = cfg.destination;

  if (typeof dest !== 'string' || dest.length === 0) {
    throw `Invalid destination "${dest}"`;
  }

  if (cfg.base) {
    cfg.base = plop.renderString(cfg.base, data);
  }

  if (typeof cfg.templateFiles === 'function') {
    cfg.templateFiles = cfg.templateFiles();
  }

  cfg.templateFiles = (0, _map.default)(_context = (0, _concat.default)(_context2 = []).call(_context2, cfg.templateFiles) // Ensure `cfg.templateFiles` is an array, even if a string is passed.
  ).call(_context, file => plop.renderString(file, data)); // render the paths as hbs templates

  const templateFiles = resolveTemplateFiles(cfg.templateFiles, cfg.base, cfg.globOptions, plop);
  const filesAdded = [];

  for (let templateFile of templateFiles) {
    const absTemplatePath = _path.default.resolve(plop.getPlopfilePath(), templateFile);

    const fileCfg = (0, _assign.default)({}, cfg, {
      path: stripExtensions(cfg.stripExtensions, resolvePath(cfg.destination, templateFile, cfg.base)),
      templateFile: absTemplatePath
    });
    const addedPath = await (0, _commonActionAddFile.default)(data, fileCfg, plop);
    filesAdded.push(addedPath);
  }

  const summary = `${filesAdded.length} files added`;
  if (!cfg.verbose) return summary;else return `${summary}\n -> ${filesAdded.join('\n -> ')}`;
}

function resolveTemplateFiles(templateFilesGlob, basePath, globOptions, plop) {
  var _context3, _context4;

  globOptions = (0, _assign.default)({
    cwd: plop.getPlopfilePath()
  }, globOptions);
  return (0, _filter.default)(_context3 = (0, _filter.default)(_context4 = _globby.default.sync(templateFilesGlob, (0, _assign.default)({
    braceExpansion: false
  }, globOptions))).call(_context4, isUnder(basePath))).call(_context3, isAbsoluteOrRelativeFileTo(plop.getPlopfilePath()));
}

function isAbsoluteOrRelativeFileTo(relativePath) {
  const isFile = file => _fs.default.existsSync(file) && _fs.default.lstatSync(file).isFile();

  return file => isFile(file) || isFile(_path.default.join(relativePath, file));
}

function isUnder(basePath = '') {
  return path => (0, _startsWith.default)(path).call(path, basePath);
}

function resolvePath(destination, file, rootPath) {
  return (0, _commonActionUtils.normalizePath)(_path.default.join(destination, dropFileRootPath(file, rootPath)));
}

function dropFileRootPath(file, rootPath) {
  return rootPath ? file.replace(rootPath, '') : dropFileRootFolder(file);
}

function dropFileRootFolder(file) {
  const fileParts = _path.default.normalize(file).split(_path.default.sep);

  fileParts.shift();
  return fileParts.join(_path.default.sep);
}

function stripExtensions(shouldStrip, fileName) {
  var _context5;

  const maybeFile = _path.default.parse(fileName);

  if ((0, _isArray.default)(shouldStrip) && !(0, _includes.default)(_context5 = (0, _map.default)(shouldStrip).call(shouldStrip, item => `.${item}`)).call(_context5, maybeFile.ext)) return fileName;
  return _path.default.parse(maybeFile.name).ext !== '' ? _path.default.join(maybeFile.dir, maybeFile.name) : fileName;
}