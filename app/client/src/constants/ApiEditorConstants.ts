import { ApiActionConfig } from "entities/Action";
import { DEFAULT_ACTION_TIMEOUT } from "ce/constants/ApiConstants";

// This constant lists all the support HTTP methods & their color in
// the entity explorer
export enum HTTP_METHOD {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export const HTTP_METHODS_COLOR: Record<HTTP_METHOD, string> = {
  GET: "#457AE6",
  POST: "#EABB0C",
  PUT: "#5BB749",
  DELETE: "#E22C2C",
  PATCH: "#6D6D6D",
};

export enum API_EDITOR_TABS {
  HEADERS = "HEADERS",
  PARAMS = "PARAMS",
  BODY = "BODY",
  PAGINATION = "PAGINATION",
  SETTINGS = "SETTINGS",
  AUTHENTICATION = "AUTHENTICATION",
}

export const HTTP_METHOD_OPTIONS = Object.values(HTTP_METHOD).map((method) => ({
  value: method,
}));

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const EMPTY_KEY_VALUE_PAIRS = [
  { key: "", value: "" },
  { key: "", value: "" },
];

export enum ApiContentType {
  NONE = "none",
  JSON = "json",
  FORM_URLENCODED = "x-www-form-urlencoded",
  MULTIPART_FORM_DATA = "multi-part/form-data",
  RAW = "text/plain",
}

// This lists all the support content types in the API body. The value field is the
// value for the content-type header. In the UI, these content types are displayed in the
// order defined here.
export const POST_BODY_FORMAT_OPTIONS: Record<
  keyof typeof ApiContentType, // using the key of ApiContentType enum as the key property of this Record type.
  string
> = {
  NONE: "none",
  JSON: "application/json",
  FORM_URLENCODED: "application/x-www-form-urlencoded",
  MULTIPART_FORM_DATA: "multipart/form-data",
  RAW: "text/plain",
};

export const DEFAULT_API_ACTION_CONFIG: ApiActionConfig = {
  timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
  encodeParamsToggle: true,
  httpMethod: HTTP_METHOD.GET,
  headers: EMPTY_KEY_VALUE_PAIRS.slice(),
  queryParameters: EMPTY_KEY_VALUE_PAIRS.slice(),
  body: "",
  formData: {
    apiContentType: POST_BODY_FORMAT_OPTIONS.NONE,
  },
  pluginSpecifiedTemplates: [
    {
      // JSON smart substitution
      value: true,
    },
  ],
};

export const DEFAULT_PROVIDER_OPTION = "Business Software";
export const CONTENT_TYPE_HEADER_KEY = "content-type";

export const POST_BODY_FORMATS = Object.values(POST_BODY_FORMAT_OPTIONS).map(
  (option) => {
    return option;
  },
);

export const POST_BODY_FORMAT_OPTIONS_ARRAY = Object.values(
  POST_BODY_FORMAT_OPTIONS,
);

export const POST_BODY_FORMAT_TITLES = Object.entries(
  POST_BODY_FORMAT_OPTIONS,
).map((option) => {
  return { title: option[0], key: option[1] };
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

export const DEFAULT_MULTI_PART_DROPDOWN_WIDTH = "77px";
export const DEFAULT_MULTI_PART_DROPDOWN_HEIGHT = "100%";
export const DEFAULT_MULTI_PART_DROPDOWN_PLACEHOLDER = "Type";
