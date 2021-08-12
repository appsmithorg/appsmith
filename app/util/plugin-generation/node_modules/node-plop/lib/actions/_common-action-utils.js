"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.getRenderedTemplatePath = getRenderedTemplatePath;
exports.getTemplate = getTemplate;
exports.getRenderedTemplate = getRenderedTemplate;
exports.getTransformedTemplate = getTransformedTemplate;
exports.throwStringifiedError = exports.getRelativeToBasePath = exports.makeDestPath = exports.normalizePath = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/json/stringify"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/assign"));

var _path = _interopRequireDefault(require("path"));

var fspp = _interopRequireWildcard(require("../fs-promise-proxy"));

const getFullData = (data, cfg) => (0, _assign.default)({}, cfg.data, data);

const normalizePath = path => {
  return !path.sep || path.sep === '\\' ? path.replace(/\\/g, '/') : path;
};

exports.normalizePath = normalizePath;

const makeDestPath = (data, cfg, plop) => {
  return _path.default.resolve(plop.getDestBasePath(), plop.renderString(normalizePath(cfg.path) || '', getFullData(data, cfg)));
};

exports.makeDestPath = makeDestPath;

function getRenderedTemplatePath(data, cfg, plop) {
  if (cfg.templateFile) {
    const absTemplatePath = _path.default.resolve(plop.getPlopfilePath(), cfg.templateFile);

    return plop.renderString(normalizePath(absTemplatePath), getFullData(data, cfg));
  }

  return null;
}

async function getTemplate(data, cfg, plop) {
  const makeTmplPath = p => _path.default.resolve(plop.getPlopfilePath(), p);

  let {
    template
  } = cfg;

  if (cfg.templateFile) {
    template = await fspp.readFile(makeTmplPath(cfg.templateFile));
  }

  if (template == null) {
    template = '';
  }

  return template;
}

async function getRenderedTemplate(data, cfg, plop) {
  const template = await getTemplate(data, cfg, plop);
  return plop.renderString(template, getFullData(data, cfg));
}

const getRelativeToBasePath = (filePath, plop) => filePath.replace(_path.default.resolve(plop.getDestBasePath()), '');

exports.getRelativeToBasePath = getRelativeToBasePath;

const throwStringifiedError = err => {
  if (typeof err === 'string') {
    throw err;
  } else {
    throw err.message || (0, _stringify.default)(err);
  }
};

exports.throwStringifiedError = throwStringifiedError;

async function getTransformedTemplate(template, data, cfg) {
  // transform() was already typechecked at runtime in interface check
  if ('transform' in cfg) {
    const result = await cfg.transform(template, data);
    if (typeof result !== 'string') throw new TypeError(`Invalid return value for transform (${(0, _stringify.default)(result)} is not a string)`);
    return result;
  } else {
    return template;
  }
}