import _typeof from "@babel/runtime-corejs3/helpers/typeof";
import _WeakMap from "@babel/runtime-corejs3/core-js/weak-map";
import _Symbol$replace from "@babel/runtime-corejs3/core-js/symbol/replace";
import _sliceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/slice";
import _reduceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/reduce";
import _Object$keys from "@babel/runtime-corejs3/core-js/object/keys";
import _Object$create from "@babel/runtime-corejs3/core-js/object/create";
import setPrototypeOf from "./setPrototypeOf.js";
import inherits from "./inherits.js";
export default function _wrapRegExp() {
  _wrapRegExp = function _wrapRegExp(re, groups) {
    return new BabelRegExp(re, undefined, groups);
  };

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