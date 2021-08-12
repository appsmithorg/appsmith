"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _changeCase = _interopRequireDefault(require("change-case"));

var _default = {
  camelCase: _changeCase.default.camel,
  snakeCase: _changeCase.default.snake,
  dotCase: _changeCase.default.dot,
  pathCase: _changeCase.default.path,
  lowerCase: _changeCase.default.lower,
  upperCase: _changeCase.default.upper,
  sentenceCase: _changeCase.default.sentence,
  constantCase: _changeCase.default.constant,
  titleCase: _changeCase.default.title,
  dashCase: _changeCase.default.param,
  kabobCase: _changeCase.default.param,
  kebabCase: _changeCase.default.param,
  properCase: _changeCase.default.pascal,
  pascalCase: _changeCase.default.pascal
};
exports.default = _default;