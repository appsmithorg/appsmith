// This constant lists all the support HTTP methods & their color in
// the entity explorer
export enum HTTP_METHOD {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

// This constant lists defines the supported HTTP protocol versions
// label defines the display name of the protocol
// value defines the value of the protocol that is sent to the server
export const HTTP_PROTOCOL = {
  HTTP11: {
    label: "HTTP/1.1",
    value: "HTTP11",
  },
  H2: {
    label: "HTTP/2",
    value: "H2",
  },
  H2C: {
    label: "H2C",
    value: "H2C",
  },
};

export const HTTP_METHODS_COLOR: Record<HTTP_METHOD, string> = {
  GET: "var(--ads-v2-color-fg-information)",
  POST: "var(--ads-v2-color-fg-warning)",
  PUT: "var(--ads-v2-color-fg-success)",
  DELETE: "var(--ads-v2-color-fg-error)",
  PATCH: "var(--ads-v2-color-fg-muted)",
};
export enum API_EDITOR_TABS {
  HEADERS = "HEADERS",
  PARAMS = "PARAMS",
  BODY = "BODY",
  PAGINATION = "PAGINATION",
  AUTHENTICATION = "AUTHENTICATION",
  SETTINGS = "SETTINGS",
}

export const HTTP_METHOD_OPTIONS = Object.values(HTTP_METHOD).map((method) => ({
  value: method,
}));

export const HTTP_PROTOCOL_VERSIONS = Object.values(HTTP_PROTOCOL);

export const EMPTY_KEY_VALUE_PAIRS = [
  { key: "", value: "" },
  { key: "", value: "" },
];

export enum ApiContentType {
  NONE = "none",
  JSON = "json",
  FORM_URLENCODED = "x-www-form-urlencoded",
  MULTIPART_FORM_DATA = "multi-part/form-data",
  BINARY = "application/octet-stream",
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
  BINARY: "application/octet-stream",
  RAW: "text/plain",
};

export const HTTP_METHODS_DEFAULT_FORMAT_TYPES: Record<HTTP_METHOD, string> = {
  GET: POST_BODY_FORMAT_OPTIONS.NONE,
  POST: POST_BODY_FORMAT_OPTIONS.JSON,
  PUT: POST_BODY_FORMAT_OPTIONS.JSON,
  DELETE: POST_BODY_FORMAT_OPTIONS.RAW,
  PATCH: POST_BODY_FORMAT_OPTIONS.JSON,
};

export const CONTENT_TYPE_HEADER_KEY = "content-type";

export enum ResponseDisplayFormats {
  JSON = "JSON",
  TABLE = "TABLE",
  RAW = "RAW",
}

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
  ARRAY = "Array",
  JSON = "JSON",
}

export interface MULTI_PART_DROPDOWN_OPTION {
  label: MultiPartOptionTypes;
  value: string;
}

export const MULTI_PART_DROPDOWN_OPTIONS: MULTI_PART_DROPDOWN_OPTION[] =
  Object.values(MultiPartOptionTypes).map((value) => ({ label: value, value }));

export const DEFAULT_MULTI_PART_DROPDOWN_PLACEHOLDER = "Type";
