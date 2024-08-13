import { isPlainObject } from "lodash";
import isInteger from "lodash/isInteger";

export const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach((segment) => {
    if (isInteger(segment)) {
      string = string + "[" + segment + "]";
    } else {
      if (string.length !== 0) {
        string = string + ".";
      }
      string = string + segment;
    }
  });
  return string;
};

export const isTrueObject = (
  value: unknown,
): value is Record<string, unknown> => {
  return isPlainObject(value);
};

export const getAllPaths = (
  records: Record<string, unknown> | unknown,
  curKey = "",
  result: Record<string, true> = {},
): Record<string, true> => {
  // Add the key if it exists
  if (curKey) result[curKey] = true;
  if (Array.isArray(records)) {
    for (let i = 0; i < records.length; i++) {
      const tempKey = curKey ? `${curKey}[${i}]` : `${i}`;
      getAllPaths(records[i], tempKey, result);
    }
  } else if (isTrueObject(records)) {
    for (const key of Object.keys(records)) {
      const tempKey = curKey ? `${curKey}.${key}` : `${key}`;
      getAllPaths(records[key], tempKey, result);
    }
  }
  return result;
};
