import { ApiActionConfig } from "entities/Action";
import { DEFAULT_ACTION_TIMEOUT } from "@appsmith/constants/ApiConstants";
import {
  HTTP_METHOD,
  EMPTY_KEY_VALUE_PAIRS,
  HTTP_METHODS_DEFAULT_FORMAT_TYPES,
} from "./CommonApiConstants";

const DEFAULT_METHOD_TYPE = HTTP_METHOD.GET;

export const REST_PLUGIN_PACKAGE_NAME = "restapi-plugin";

export const DEFAULT_API_ACTION_CONFIG: ApiActionConfig = {
  timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
  encodeParamsToggle: true,
  httpMethod: DEFAULT_METHOD_TYPE,
  headers: EMPTY_KEY_VALUE_PAIRS.slice(),
  queryParameters: EMPTY_KEY_VALUE_PAIRS.slice(),
  body: "",
  bodyFormData: [],
  formData: {
    apiContentType: HTTP_METHODS_DEFAULT_FORMAT_TYPES[DEFAULT_METHOD_TYPE],
  },
  pluginSpecifiedTemplates: [
    {
      // JSON smart substitution
      value: true,
    },
  ],
};

export const DEFAULT_CREATE_API_CONFIG = {
  config: DEFAULT_API_ACTION_CONFIG,
  datasource: {
    name: "DEFAULT_REST_DATASOURCE",
  },
  eventData: {
    actionType: "API",
  },
};
