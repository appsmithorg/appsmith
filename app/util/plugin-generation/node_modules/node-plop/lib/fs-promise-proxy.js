"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.constants = exports.fileExists = exports.writeFileRaw = exports.readFileRaw = exports.writeFile = exports.readFile = exports.chmod = exports.stat = exports.readdir = exports.makeDir = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _util = require("util");

const _readFile = (0, _util.promisify)(_fs.default.readFile);

const _writeFile = (0, _util.promisify)(_fs.default.writeFile);

const _access = (0, _util.promisify)(_fs.default.access);

const makeDir = (0, _util.promisify)(_mkdirp.default);
exports.makeDir = makeDir;
const readdir = (0, _util.promisify)(_fs.default.readdir);
exports.readdir = readdir;
const stat = (0, _util.promisify)(_fs.default.stat);
exports.stat = stat;
const chmod = (0, _util.promisify)(_fs.default.chmod);
exports.chmod = chmod;

const readFile = path => _readFile(path, 'utf8');

exports.readFile = readFile;

const writeFile = (path, data) => _writeFile(path, data, 'utf8');

exports.writeFile = writeFile;

const readFileRaw = path => _readFile(path, null);

exports.readFileRaw = readFileRaw;

const writeFileRaw = (path, data) => _writeFile(path, data, null);

exports.writeFileRaw = writeFileRaw;

const fileExists = path => _access(path).then(() => true, () => false);

exports.fileExists = fileExists;
const constants = _fs.default.constants;
exports.constants = constants;