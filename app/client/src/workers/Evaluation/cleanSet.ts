import { get } from "lodash";

/**
 *
 * This methods avoids the mutation leak from target object while setting property.
 *
 * @param sourceObj
 * @param path
 * @param value
 * @return newObject
 */
export const cleanSet = <T>(sourceObj: T, path: string, value: unknown) => {
  const paths = path.split(".");
  let valueToSet = value;
  while (paths.length >= 1) {
    const propertyName = paths.pop() as string;
    const newParentObj = paths.length
      ? { ...get(sourceObj, paths, {}) }
      : { ...sourceObj };
    newParentObj[propertyName] = valueToSet;
    valueToSet = newParentObj;
  }
  return valueToSet as T;
};
