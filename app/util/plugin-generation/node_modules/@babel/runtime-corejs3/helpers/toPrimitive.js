var _Symbol$toPrimitive = require("@babel/runtime-corejs3/core-js/symbol/to-primitive");

var _typeof = require("@babel/runtime-corejs3/helpers/typeof")["default"];

function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[_Symbol$toPrimitive];

  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }

  return (hint === "string" ? String : Number)(input);
}

module.exports = _toPrimitive;
module.exports["default"] = module.exports, module.exports.__esModule = true;