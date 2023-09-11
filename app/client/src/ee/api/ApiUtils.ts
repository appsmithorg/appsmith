import { getDefaultEnvironmentId } from "@appsmith/selectors/environmentSelectors";
import store from "store";

export * from "ce/api/ApiUtils";

export const DEFAULT_ENV_ID = "";

// function to get the default environment
export const getDefaultEnvId = () => {
  const default_env_id_from_store = getDefaultEnvironmentId(store.getState());
  if (!!default_env_id_from_store && default_env_id_from_store.length > 0)
    return default_env_id_from_store;
  return DEFAULT_ENV_ID;
};
