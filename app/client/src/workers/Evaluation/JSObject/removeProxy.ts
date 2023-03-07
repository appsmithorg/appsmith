import { isArray } from "lodash";

export function getOriginalValueFromProxy(obj: Record<string, unknown>) {
  if (obj && obj.$isProxy) {
    return obj.$targetValue;
  }
  return obj;
}

export function removeProxyObject(objOrArr: any) {
  const newObjOrArr: any = getOriginalValueFromProxy(objOrArr);
  if (
    newObjOrArr &&
    (isArray(newObjOrArr) || newObjOrArr.toString() === "[object Object]")
  ) {
    for (const key in objOrArr) {
      newObjOrArr[key] = removeProxyObject(objOrArr[key]);
    }
  }
  return newObjOrArr;
}
