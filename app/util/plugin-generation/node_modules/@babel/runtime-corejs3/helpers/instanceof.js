var _Symbol = require("@babel/runtime-corejs3/core-js/symbol");

var _Symbol$hasInstance = require("@babel/runtime-corejs3/core-js/symbol/has-instance");

function _instanceof(left, right) {
  if (right != null && typeof _Symbol !== "undefined" && right[_Symbol$hasInstance]) {
    return !!right[_Symbol$hasInstance](left);
  } else {
    return left instanceof right;
  }
}

module.exports = _instanceof;
module.exports["default"] = module.exports, module.exports.__esModule = true;