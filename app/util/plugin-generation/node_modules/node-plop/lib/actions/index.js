"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

_Object$defineProperty(exports, "add", {
  enumerable: true,
  get: function () {
    return _add.default;
  }
});

_Object$defineProperty(exports, "addMany", {
  enumerable: true,
  get: function () {
    return _addMany.default;
  }
});

_Object$defineProperty(exports, "modify", {
  enumerable: true,
  get: function () {
    return _modify.default;
  }
});

_Object$defineProperty(exports, "append", {
  enumerable: true,
  get: function () {
    return _append.default;
  }
});

var _add = _interopRequireDefault(require("./add"));

var _addMany = _interopRequireDefault(require("./addMany"));

var _modify = _interopRequireDefault(require("./modify"));

var _append = _interopRequireDefault(require("./append"));