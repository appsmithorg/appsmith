import { ApiActionConfig } from "entities/Action";
import { DEFAULT_ACTION_TIMEOUT } from "constants/ApiConstants";
import { HttpMethod } from "api/Api";

// This constant lists all the support HTTP methods & their color in
// the entity explorer
export const HTTP_METHODS_ENUM: Record<
  string,
  { value: HttpMethod; color: string }
> = {
  GET: { value: "GET", color: "#457AE6" },
  POST: { value: "POST", color: "#EABB0C" },
  PUT: { value: "PUT", color: "#5BB749" },
  DELETE: { value: "DELETE", color: "#E22C2C" },
  PATCH: { value: "PATCH", color: "#6D6D6D" },
};
Object.freeze(HTTP_METHODS_ENUM);

export const HTTP_METHOD_OPTIONS = Object.values(HTTP_METHODS_ENUM).map(
  (method) => ({
    value: method.value,
  }),
);

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const EMPTY_KEY_VALUE_PAIRS = [
  { key: "", value: "" },
  { key: "", value: "" },
];

export const DEFAULT_API_ACTION_CONFIG: ApiActionConfig = {
  timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
  encodeParamsToggle: true,
  httpMethod: HTTP_METHODS_ENUM.GET.value,
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
  NONE = "none",
  JSON = "json",
  FORM_URLENCODED = "x-www-form-urlencoded",
  MULTIPART_FORM_DATA = "multi-part",
  RAW = "raw",
}

// This lists all the support content types in the API body. The value field is the
// value for the content-type header. In the UI, these content types are displayed in the
// order defined here.
export const POST_BODY_FORMAT_OPTIONS: Record<
  string,
  { label: ApiContentTypes; value: string }
> = {
  NONE: {
    label: ApiContentTypes.NONE,
    value: "none",
  },
  JSON: {
    label: ApiContentTypes.JSON,
    value: "application/json",
  },
  FORM_URLENCODED: {
    label: ApiContentTypes.FORM_URLENCODED,
    value: "application/x-www-form-urlencoded",
  },
  MULTIPART_FORM_DATA: {
    label: ApiContentTypes.MULTIPART_FORM_DATA,
    value: "multipart/form-data",
  },
  RAW: {
    label: ApiContentTypes.RAW,
    value: "raw",
  },
};

export const POST_BODY_FORMATS = Object.values(POST_BODY_FORMAT_OPTIONS).map(
  (option) => {
    return option.value;
  },
);

export const POST_BODY_FORMAT_OPTIONS_ARRAY = Object.values(
  POST_BODY_FORMAT_OPTIONS,
);

export const POST_BODY_FORMAT_TITLES = Object.values(
  POST_BODY_FORMAT_OPTIONS,
).map((option) => {
  return { title: option.label, key: option.value };
});

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
