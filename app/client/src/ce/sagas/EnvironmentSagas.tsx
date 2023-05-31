import { getQueryParams } from "utils/URLUtils";

export const ENVIRONMENT_QUERY_KEY = "environment";

export function getCurrentEnvironment() {
  const queryParams = getQueryParams();
  if (!!queryParams && queryParams.hasOwnProperty(ENVIRONMENT_QUERY_KEY)) {
    return queryParams[ENVIRONMENT_QUERY_KEY].toLowerCase();
  }
  return "unused_env";
}
