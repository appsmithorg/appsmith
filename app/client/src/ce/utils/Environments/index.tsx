import type { Datasource } from "entities/Datasource";
import { getQueryParams } from "utils/URLUtils";

export const ENVIRONMENT_QUERY_KEY = "environment";

export const getCurrentEnvironment = () => {
  const queryParams = getQueryParams();
  if (!!queryParams && queryParams.hasOwnProperty(ENVIRONMENT_QUERY_KEY)) {
    return queryParams[ENVIRONMENT_QUERY_KEY].toLowerCase();
  }
  return "unused_env";
};

export const isEnvironmentConfigured = (
  datasource: Datasource | null,
  environment?: string,
) => {
  !environment && (environment = getCurrentEnvironment());
  const isConfigured =
    datasource &&
    datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isConfigured;
  return isConfigured ? isConfigured : false;
};

export const isEnvironmentValid = (
  datasource: Datasource | null,
  environment?: string,
) => {
  !environment && (environment = getCurrentEnvironment());
  const isValid =
    datasource &&
    datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isValid;
  return isValid ? isValid : false;
};
