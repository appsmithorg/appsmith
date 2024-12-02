import type { InternalAxiosRequestConfig } from "axios";

export const addVersionHeader = (
  config: InternalAxiosRequestConfig,
  options: { version: string },
) => {
  const { version } = options;

  config.headers = config.headers || {};
  config.headers["X-Appsmith-Version"] = version;

  return config;
};
