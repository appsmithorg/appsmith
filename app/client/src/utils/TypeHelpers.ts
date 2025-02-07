import { isString, isNumber, isBoolean, isArray, isPlainObject, isNil, isFunction } from "lodash";

export enum Types {
  URL = "URL",
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
  FUNCTION = "FUNCTION",
  UNDEFINED = "UNDEFINED",
  NULL = "NULL",
  UNKNOWN = "UNKNOWN",
}

export const getType = (value: unknown) => {
  if (isString(value)) return Types.STRING;

  if (isNumber(value)) return Types.NUMBER;

  if (isBoolean(value)) return Types.BOOLEAN;

  if (Array.isArray(value)) return Types.ARRAY;

  if (isFunction(value)) return Types.FUNCTION;

  if (isPlainObject(value)) return Types.OBJECT;

  if (value === undefined) return Types.UNDEFINED;

  if (value === null) return Types.NULL;

  return Types.UNKNOWN;
};

export function isURL(str: string) {
  const pattern = new RegExp(
    "^((blob:)?https?:\\/\\/)?" + //protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(/[^?#]*)?" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i",
  ); // fragment locator

  return !!pattern.test(str);
}

export type TruthyPrimitiveTypes = number | string | boolean | bigint | symbol;
