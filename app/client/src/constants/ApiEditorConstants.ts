import { RestAction } from "api/ActionAPI";

export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const PLUGIN_NAME = "RestTemplatePluginExecutor";

export const DEFAULT_API_ACTION: Partial<RestAction> = {
  actionConfiguration: {
    httpMethod: HTTP_METHODS[0],
  },
};
