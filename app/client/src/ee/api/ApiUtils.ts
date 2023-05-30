export * from "ce/api/ApiUtils";

export const DEFAULT_ENV_ID = "unused_env";

export const getEnvironmentIdForHeader = (): string => {
  return DEFAULT_ENV_ID;
};
