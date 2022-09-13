import { ApiActionConfig } from "entities/Action";
import { DEFAULT_ACTION_TIMEOUT } from "@appsmith/constants/ApiConstants";
import {
  CONTENT_TYPE_HEADER_KEY,
  EMPTY_KEY_VALUE_PAIRS,
  HTTP_METHOD,
  POST_BODY_FORMAT_OPTIONS,
} from "./CommonApiConstants";

export const GRAPHQL_PLUGIN_PACKAGE_NAME = "graphql-plugin";

export const GRAPHQL_HTTP_METHOD_OPTIONS = [
  {
    value: HTTP_METHOD.GET,
  },
  {
    value: HTTP_METHOD.POST,
  },
];

// Graphql Pagination type
type GRAPHQL_PAGINATION_INDIVIDUAL_TYPE = {
  name?: any;
  type?: any;
  value?: any;
};

export type GRAPHQL_PAGINATION_TYPE = {
  cursorBased?: {
    next?: {
      limit?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE & { isSeparate: boolean };
      cursor?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE;
    };
    previous?: {
      limit?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE;
      cursor?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE;
    };
  };
  limitBased?: {
    limit?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE;
    offset?: GRAPHQL_PAGINATION_INDIVIDUAL_TYPE;
  };
};

// Graphql Default Config
export const DEFAULT_GRAPHQL_ACTION_CONFIG: ApiActionConfig = {
  timeoutInMillisecond: DEFAULT_ACTION_TIMEOUT,
  encodeParamsToggle: true,
  httpMethod: HTTP_METHOD.POST,
  headers: [
    { key: CONTENT_TYPE_HEADER_KEY, value: POST_BODY_FORMAT_OPTIONS.JSON },
    { key: "", value: "" },
  ],
  queryParameters: EMPTY_KEY_VALUE_PAIRS.slice(),
  body: "",
  formData: {
    apiContentType: POST_BODY_FORMAT_OPTIONS.JSON,
  },
  pluginSpecifiedTemplates: [
    {
      // JSON smart substitution
      value: true,
    },
    {
      // Query Variables
      value: "",
    },
    {
      /* 
        Pagination data having structure : GRAPHQL_PAGINATION_TYPE
      */
      value: {},
    },
  ],
};

export const DEFAULT_CREATE_GRAPHQL_CONFIG = {
  config: DEFAULT_GRAPHQL_ACTION_CONFIG,
  datasource: {
    name: "DEFAULT_GRAPHQL_DATASOURCE",
  },
  eventData: {
    actionType: "GRAPHQL",
  },
};
