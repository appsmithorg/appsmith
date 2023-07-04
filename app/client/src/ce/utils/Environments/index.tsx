import type { Datasource } from "entities/Datasource";

export const ENVIRONMENT_QUERY_KEY = "environment";
export const ENVIRONMENT_LOCAL_STORAGE_KEY = "currentEnvironment";
export const ENVIRONMENT_ID_LOCAL_STORAGE_KEY = "currentEnvironmentId";

export const updateLocalStorage = (name: string, id: string) => {
  // Set the values of currentEnv and currentEnvId in localStorage also
  localStorage.setItem(ENVIRONMENT_LOCAL_STORAGE_KEY, name.toLowerCase());
  localStorage.setItem(ENVIRONMENT_ID_LOCAL_STORAGE_KEY, id);
};

// function to get the current environment from the URL
export const getCurrentEnvironment = () => {
  const localStorageEnv = localStorage.getItem(ENVIRONMENT_LOCAL_STORAGE_KEY);
  //compare currentEnv with local storage and get currentEnvId from localstorage if true

  if (localStorageEnv && localStorageEnv.length > 0) {
    const localStorageEnvId = localStorage.getItem(
      ENVIRONMENT_ID_LOCAL_STORAGE_KEY,
    );
    if (!!localStorageEnvId && localStorageEnvId?.length > 0)
      return localStorageEnvId;
  }
  return "unused_env";
};

// function to check if the datasource is configured for the current environment
export const isEnvironmentConfigured = (
  datasource: Datasource | null,
  environment?: string,
) => {
  !environment && (environment = getCurrentEnvironment());
  const isConfigured =
    !!datasource &&
    !!datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isConfigured;
  return !!isConfigured ? isConfigured : false;
};

// function to check if the datasource is valid for the current environment
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
