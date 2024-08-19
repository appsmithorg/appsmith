import isPlainObject from "lodash/isPlainObject";
import lodashIsInteger from "lodash/isInteger";

export const isTrueObject = (
  value: unknown,
): value is Record<string, unknown> => {
  return isPlainObject(value);
};

const isInteger = (value: string | number) => {
  if (typeof value === "number") {
    return lodashIsInteger(value);
  } else if (typeof value === "string") {
    return /^\d+$/.test(value.trim());
  }
  return false;
};

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
