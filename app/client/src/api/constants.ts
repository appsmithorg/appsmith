import type { CreateAxiosDefaults } from "axios";
import { ID_EXTRACTION_REGEX } from "constants/routes";
import { convertObjectToQueryParams } from "utils/URLUtils";
import { UNUSED_ENV_ID } from "constants/EnvironmentContants";
import { REQUEST_TIMEOUT_MS } from "ee/constants/ApiConstants";

export const DEFAULT_AXIOS_CONFIG: CreateAxiosDefaults = {
  baseURL: "/api/",
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  paramsSerializer: convertObjectToQueryParams,
};

export const EXECUTION_ACTION_REGEX = /actions\/execute/;
export const TIMEOUT_ERROR_REGEX = /timeout of (\d+)ms exceeded/;
export const AXIOS_CONNECTION_ABORTED_CODE = "ECONNABORTED";

export const DEFAULT_ENV_ID = UNUSED_ENV_ID;

export const BLOCKED_ROUTES = [
  "v1/app-templates",
  "v1/datasources/mocks",
  "v1/usage-pulse",
  "v1/applications/releaseItems",
  "v1/saas",
];

export const BLOCKED_ROUTES_REGEX = new RegExp(
  `^(${BLOCKED_ROUTES.join("|")})($|/)`,
);

export const ENV_ENABLED_ROUTES = [
  `v1/datasources/${ID_EXTRACTION_REGEX}/structure`,
  `/v1/datasources/${ID_EXTRACTION_REGEX}/trigger`,
  "v1/actions/execute",
  "v1/saas",
];

export const ENV_ENABLED_ROUTES_REGEX = new RegExp(
  `^(${ENV_ENABLED_ROUTES.join("|")})($|/)`,
);
