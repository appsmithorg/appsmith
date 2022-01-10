import { getType, isURL, Types } from "utils/TypeHelpers";

const BASE64_STRING_REGEX = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

export const isBase64String = (data: any) => {
  return getType(data) === Types.STRING && BASE64_STRING_REGEX.test(data);
};

export const isUrlString = (data: any) => {
  return getType(data) === Types.STRING && isURL(data);
};
