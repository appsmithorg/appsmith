export * from "ce/api/ApiUtils";
import { DEFAULT_ENV_ID } from "constants/EnvironmentContants";

export const getEnvironmentIdForHeader = (): string => {
  return DEFAULT_ENV_ID;
};

// function to get the default environment
export const getDefaultEnvId = () => {
  return DEFAULT_ENV_ID;
};
