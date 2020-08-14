import { RestAction } from "entities/Action";
import { DEFAULT_ACTION_TIMEOUT } from "constants/ApiConstants";
import { zipObject } from "lodash";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const HTTP_METHOD_COLORS = [
  "#457AE6",
  "#EABB0C",
  "#5BB749",
  "#E22C2C",
  "#6D6D6D",
];

export const HTTP_METHOD_COLOR_MAP = zipObject(
  HTTP_METHODS,
  HTTP_METHOD_COLORS,
);

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const DEFAULT_API_ACTION: Partial<RestAction> = {
  actionConfiguration: {
    timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
    httpMethod: HTTP_METHODS[0],
    headers: [
      { key: "", value: "" },
      { key: "", value: "" },
    ],
    queryParameters: [
      { key: "", value: "" },
      { key: "", value: "" },
    ],
  },
};

export const PLUGIN_TYPE_API = "API";
export const DEFAULT_PROVIDER_OPTION = "Business Software";
export const CONTENT_TYPE = "content-type";

export const POST_BODY_FORMAT_OPTIONS = [
  { label: "json", value: "application/json" },
  {
    label: "x-www-form-urlencoded",
    value: "application/x-www-form-urlencoded",
  },
  { label: "form-data", value: "multipart/form-data" },
  { label: "raw", value: "raw" },
];

export const POST_BODY_FORMAT_OPTIONS_NO_MULTI_PART = POST_BODY_FORMAT_OPTIONS.filter(
  option => {
    return option.value !== "multipart/form-data";
  },
);

export const POST_BODY_FORMATS = POST_BODY_FORMAT_OPTIONS.map(option => {
  return option.value;
});
