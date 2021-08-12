var _typeof = require("@babel/runtime-corejs3/helpers/typeof")["default"];

var _WeakMap = require("@babel/runtime-corejs3/core-js/weak-map");

var _Symbol$replace = require("@babel/runtime-corejs3/core-js/symbol/replace");

var _sliceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/slice");

var _reduceInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/reduce");

var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");

var _Object$create = require("@babel/runtime-corejs3/core-js/object/create");

var setPrototypeOf = require("./setPrototypeOf.js");

var inherits = require("./inherits.js");

function _wrapRegExp() {
  module.exports = _wrapRegExp = function _wrapRegExp(re, groups) {
    return new BabelRegExp(re, undefined, groups);
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  var _super = RegExp.prototype;

  var _groups = new _WeakMap();

  function BabelRegExp(re, flags, groups) {
    var _this = new RegExp(re, flags);

    _groups.set(_this, groups || _groups.get(re));

    return setPrototypeOf(_this, BabelRegExp.prototype);
  }

  inherits(BabelRegExp, RegExp);

  BabelRegExp.prototype.exec = function (str) {
    var result = _super.exec.call(this, str);

    if (result) result.groups = buildGroups(result, this);
    return result;
  };

  BabelRegExp.prototype[_Symbol$replace] = function (str, substitution) {
    if (typeof substitution === "string") {
      var groups = _groups.get(this);

      return _super[_Symbol$replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) {
        return "$" + groups[name];
      }));
    } else if (typeof substitution === "function") {
      var _this = this;

      return _super[_Symbol$replace].call(this, str, function () {
        var args = arguments;

        if (_typeof(args[args.length - 1]) !== "object") {
          args = _sliceInstanceProperty([]).call(args);
          args.push(buildGroups(args, _this));
        }

        return substitution.apply(this, args);
      });
    } else {
      return _super[_Symbol$replace].call(this, str, substitution);
    }
  };

  function buildGroups(result, re) {
    var _context;

    var g = _groups.get(re);

    return _reduceInstanceProperty(_context = _Object$keys(g)).call(_context, function (groups, name) {
      groups[name] = result[g[name]];
      return groups;
    }, _Object$create(null));
  }

  return _wrapRegExp.apply(this, arguments);
}

module.exports = _wrapRegExp;
module.exports["default"] = module.exports, module.exports.__esModule = true;