import _Reflect$construct from "@babel/runtime-corejs3/core-js/reflect/construct";
import _bindInstanceProperty from "@babel/runtime-corejs3/core-js/instance/bind";
import setPrototypeOf from "./setPrototypeOf.js";
import isNativeReflectConstruct from "./isNativeReflectConstruct.js";
export default function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    _construct = _Reflect$construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);

      var Constructor = _bindInstanceProperty(Function).apply(Parent, a);

      var instance = new Constructor();
      if (Class) setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}