import type { InternalAxiosRequestConfig } from "axios";
import { ENV_ENABLED_ROUTES_REGEX } from "ee/constants/ApiConstants";

export const addEnvironmentHeader = (
  config: InternalAxiosRequestConfig,
  options: { env: string },
) => {
  const { env } = options;

  config.headers = config.headers || {};

  if (ENV_ENABLED_ROUTES_REGEX.test(config.url?.split("?")[0] || "")) {
    if (env) {
      config.headers["X-Appsmith-EnvironmentId"] = env;
    }
  }

  return config;
};
