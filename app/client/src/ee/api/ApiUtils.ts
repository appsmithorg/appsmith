export * from "ce/api/ApiUtils";

const DEFAULT_ENV_ID = "unused_env";

export const getEnvironmentIdForHeader = (): string => {
  return DEFAULT_ENV_ID;
};
