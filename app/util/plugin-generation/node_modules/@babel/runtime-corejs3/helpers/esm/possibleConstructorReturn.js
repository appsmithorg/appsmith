import _typeof from "@babel/runtime-corejs3/helpers/typeof";
import assertThisInitialized from "./assertThisInitialized.js";
export default function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}