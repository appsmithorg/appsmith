import { PluginType } from "entities/Action";
import type { Datasource } from "entities/Datasource";

export const DB_NOT_SUPPORTED = [
  PluginType.REMOTE,
  PluginType.SAAS,
  PluginType.AI,
];

export const getUserPreferenceFromStorage = () => {
  return "true";
};

// function to check if the datasource is created for the current environment
export const isStorageEnvironmentCreated = (
  datasource: Datasource | null,
  environment: string,
) => {
  return (
    !!datasource &&
    datasource.hasOwnProperty("datasourceStorages") &&
    !!datasource.datasourceStorages &&
    datasource.datasourceStorages.hasOwnProperty(environment) &&
    datasource.datasourceStorages[environment].hasOwnProperty("id") &&
    datasource.datasourceStorages[environment].hasOwnProperty(
      "datasourceConfiguration",
    )
  );
};

// function to check if the datasource is configured for the current environment
export const isEnvironmentConfigured = (
  datasource: Datasource | null,
  environment: string,
) => {
  const isConfigured =
    !!datasource &&
    !!datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isConfigured;

  return !!isConfigured ? isConfigured : false;
};

// function to check if the datasource is configured for any environment
export const doesAnyDsConfigExist = (datasource: Datasource | null) => {
  let isConfigured = false;

  if (!!datasource && !!datasource.datasourceStorages) {
    const envsList = Object.keys(datasource.datasourceStorages);

    if (envsList.length === 0) {
      isConfigured = false;
    } else {
      // Allow user to create a query even though the config is not
      // there for the current environment
      isConfigured = true;
    }
  }

  return isConfigured;
};

// function to check if the datasource is valid for the current environment
export const isEnvironmentValid = (
  datasource: Datasource | null,
  environment: string,
) => {
  const isValid =
    datasource &&
    datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isValid;

  return isValid ? isValid : false;
};

/*
 * Functiont to check get the datasource configuration for current ENV
 */
export const getEnvironmentConfiguration = (
  datasource: Datasource | null,
  environment: string,
) => {
  return datasource?.datasourceStorages?.[environment]?.datasourceConfiguration;
};
