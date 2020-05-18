import { RestAction } from "api/ActionAPI";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const DEFAULT_API_ACTION: Partial<RestAction> = {
  actionConfiguration: {
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

export const API_CONSTANT = "API";
export const DEFAULT_PROVIDER_OPTION = "Business Software";
export const CONTENT_TYPE = "content-type";
export const POST_BODY_FORMATS = [
  "application/json",
  "application/x-www-form-urlencoded",
  "raw",
];

export const POST_BODY_FORMAT_OPTIONS = POST_BODY_FORMATS.map(method => ({
  label: method,
  value: method,
}));
