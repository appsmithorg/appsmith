import { getDefaultEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";
import store from "store";

export * from "ce/api/ApiUtils";

export const DEFAULT_ENV_ID = "";

export const getEnvironmentIdForHeader = (): string => {
  let activeEnv = getCurrentEnvironment();
  // If we can't find env in storage, get default environment from redux store as per isDefault flag.
  if (activeEnv === "unused_env") {
    activeEnv = getDefaultEnvironmentId(store.getState());
  }
  // If no environment is specified in the URL and no default environment is set.
  if (activeEnv === undefined || activeEnv === null || activeEnv === "") {
    activeEnv = DEFAULT_ENV_ID;
  }
  return activeEnv;
};

// function to get the default environment
export const getDefaultEnvId = () => {
  const default_env_id_from_store = getDefaultEnvironmentId(store.getState());
  if (!!default_env_id_from_store && default_env_id_from_store.length > 0)
    return default_env_id_from_store;
  return DEFAULT_ENV_ID;
};
