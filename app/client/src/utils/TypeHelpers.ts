import _ from "lodash";

export enum Types {
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
  if (_.isString(value)) return Types.STRING;
  if (_.isNumber(value)) return Types.NUMBER;
  if (_.isBoolean(value)) return Types.BOOLEAN;
  if (Array.isArray(value)) return Types.ARRAY;
  if (_.isFunction(value)) return Types.FUNCTION;
  if (_.isObject(value)) return Types.OBJECT;
  if (_.isUndefined(value)) return Types.UNDEFINED;
  if (_.isNull(value)) return Types.NULL;
  return Types.UNKNOWN;
};
