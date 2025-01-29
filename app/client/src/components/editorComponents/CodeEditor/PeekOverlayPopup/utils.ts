import { get } from "lodash";

export const getPropertyData = (src: unknown, propertyPath: string[]) => {
  return propertyPath.length > 0 ? get(src, propertyPath) : src;
};
export const getDataTypeHeader = (data: unknown) => {
  const dataType = typeof data;

  if (dataType === "object") {
    if (Array.isArray(data)) return "array";

    if (data === null) return "null";
  }

  return dataType;
};
