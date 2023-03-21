import { isTrueObject } from "ce/workers/Evaluation/evaluationUtils";
import { isArray } from "lodash";

export function getOriginalValueFromProxy(obj: Record<string, unknown>) {
  if (obj && obj.$isProxy) {
    return obj.$targetValue;
  }
  return obj;
}

export function removeProxyObject(objOrArr: any) {
  const newObjOrArr: any = getOriginalValueFromProxy(objOrArr);
  if (newObjOrArr && (isArray(newObjOrArr) || isTrueObject(newObjOrArr))) {
    for (const key in objOrArr) {
      // @ts-expect-error: type unknown
      newObjOrArr[key] = removeProxyObject(objOrArr[key]);
    }
  }
  return newObjOrArr;
}
