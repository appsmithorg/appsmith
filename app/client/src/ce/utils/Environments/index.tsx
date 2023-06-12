import type { Datasource } from "entities/Datasource";
import { getQueryParams } from "utils/URLUtils";

export const isEnvironmentConfigured = (
  datasource: Datasource | null,
  environment: string,
) => {
  return (
    datasource &&
    datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isConfigured
  );
};

export const ENVIRONMENT_QUERY_KEY = "environment";

export const getCurrentEnvironment = () => {
  const queryParams = getQueryParams();
  if (!!queryParams && queryParams.hasOwnProperty(ENVIRONMENT_QUERY_KEY)) {
    return queryParams[ENVIRONMENT_QUERY_KEY].toLowerCase();
  }
  return "unused_env";
};
