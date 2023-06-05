import {
  getDefaultEnvironemntId,
  getEnvironmentIdByName,
} from "@appsmith/selectors/environmentSelector";
import store from "store";
import getQueryParamsObject from "utils/getQueryParamsObject";

export * from "ce/api/ApiUtils";

export const DEFAULT_ENV_ID = "";

export const getEnvironmentIdForHeader = (): string => {
  let activeEnv = getQueryParamsObject().environment;
  // If no environment is specified in the URL
  // then get default environment from redux store as per isDefault flag.
  if (activeEnv === undefined || activeEnv === null || activeEnv === "") {
    activeEnv = getDefaultEnvironemntId(store.getState());
  }
  // else fetch environment id for the environment name.
  else {
    activeEnv = getEnvironmentIdByName(store.getState(), activeEnv);
  }
  // If no environment is specified in the URL and no default environment is set.
  if (activeEnv === undefined || activeEnv === null || activeEnv === "") {
    activeEnv = DEFAULT_ENV_ID;
  }
  return activeEnv;
};
