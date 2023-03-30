import { isTrueObject } from "ce/workers/Evaluation/evaluationUtils";
import { isArray } from "lodash";

export function getOriginalValueFromProxy(obj: Record<string, unknown>) {
  if (obj && obj.$isProxy) {
    return obj.$targetValue;
  }
  return obj;
}

export function removeProxyObject(value: any) {
  const newObjOrArr: any = getOriginalValueFromProxy(value);
  if (newObjOrArr && (isArray(newObjOrArr) || isTrueObject(newObjOrArr))) {
    for (const key in newObjOrArr) {
      // @ts-expect-error: type unknown
      newObjOrArr[key] = removeProxyObject(newObjOrArr[key]);
    }
  }
  return newObjOrArr;
}
