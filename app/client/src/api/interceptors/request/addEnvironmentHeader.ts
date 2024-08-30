import store from "store";
import type { InternalAxiosRequestConfig } from "axios";
import { ENV_ENABLED_ROUTES_REGEX } from "ee/api/constants";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";

export const addEnvironmentHeader = (config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  config.headers = config.headers || {};

  if (ENV_ENABLED_ROUTES_REGEX.test(config.url?.split("?")[0] || "")) {
    const activeEnv = getCurrentEnvironmentId(state);

    if (activeEnv) {
      config.headers["X-Appsmith-EnvironmentId"] = activeEnv;
    }
  }
  return config;
};
