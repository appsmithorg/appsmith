import _typeof from "@babel/runtime-corejs3/helpers/typeof";
import _Symbol$toPrimitive from "@babel/runtime-corejs3/core-js/symbol/to-primitive";
export default function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[_Symbol$toPrimitive];

  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }

  return (hint === "string" ? String : Number)(input);
}