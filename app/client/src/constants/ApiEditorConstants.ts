import { ApiActionConfig } from "entities/Action";
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

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map((method) => ({
  value: method,
}));

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const EMPTY_KEY_VALUE_PAIRS = [
  { key: "", value: "" },
  { key: "", value: "" },
];

export const DEFAULT_API_ACTION_CONFIG: ApiActionConfig = {
  timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
  encodeParamsToggle: true,
  httpMethod: HTTP_METHODS[0],
  headers: EMPTY_KEY_VALUE_PAIRS.slice(),
  queryParameters: EMPTY_KEY_VALUE_PAIRS.slice(),
  body: "",
  pluginSpecifiedTemplates: [
    {
      // JSON smart substitution
      value: true,
    },
  ],
};

export const DEFAULT_PROVIDER_OPTION = "Business Software";
export const CONTENT_TYPE_HEADER_KEY = "content-type";

export enum ApiContentTypes {
  JSON = "json",
  FORM_URLENCODED = "x-www-form-urlencoded",
  MULTIPART_FORM_DATA = "multi-part",
  RAW = "raw",
}

export const POST_BODY_FORMAT_OPTIONS: Array<{
  label: ApiContentTypes;
  value: string;
}> = [
  { label: ApiContentTypes.JSON, value: "application/json" },
  {
    label: ApiContentTypes.FORM_URLENCODED,
    value: "application/x-www-form-urlencoded",
  },
  { label: ApiContentTypes.MULTIPART_FORM_DATA, value: "multipart/form-data" },
  { label: ApiContentTypes.RAW, value: "raw" },
];

export const POST_BODY_FORMATS = POST_BODY_FORMAT_OPTIONS.map((option) => {
  return option.value;
});

export const POST_BODY_FORMAT_TITLES = POST_BODY_FORMAT_OPTIONS.map(
  (option) => {
    return { title: option.label, key: option.value };
  },
);

export enum MultiPartOptionTypes {
  TEXT = "Text",
  FILE = "File",
}

export interface MULTI_PART_DROPDOWN_OPTION {
  label: MultiPartOptionTypes;
  value: string;
}

export const MULTI_PART_DROPDOWN_OPTIONS: MULTI_PART_DROPDOWN_OPTION[] = [
  {
    label: MultiPartOptionTypes.TEXT,
    value: "TEXT",
  },
  {
    label: MultiPartOptionTypes.FILE,
    value: "FILE",
  },
];

export const DEFAULT_MULTI_PART_DROPDOWN_WIDTH = "75px";

export const DEFAULT_MULTI_PART_DROPDOWN_COLOR = "#F0F0F0";

export const DEFAULT_MULTI_PART_DROPDOWN_PLACEHOLDER = "Type";
