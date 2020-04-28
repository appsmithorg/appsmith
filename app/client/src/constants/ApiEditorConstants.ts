import { RestAction } from "api/ActionAPI";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const PLUGIN_NAME = "RestTemplatePluginExecutor";
export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";
export const PLUGIN_NAME_RAPIDAPI = "Rapid API Plugin";

export const DEFAULT_API_ACTION: Partial<RestAction> = {
  actionConfiguration: {
    httpMethod: HTTP_METHODS[0],
  },
};

export const DEFAULT_PROVIDER_OPTION = "Business Software";
export const POST_BODY_FORMATS = ["application/json", "x-www-form-urlencoded"];

export const POST_BODY_FORMAT_OPTIONS = POST_BODY_FORMATS.map(method => ({
  label: method,
  value: method,
}));
