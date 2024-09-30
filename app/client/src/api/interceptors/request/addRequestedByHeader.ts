import type { InternalAxiosRequestConfig } from "axios";

export const addRequestedByHeader = (config: InternalAxiosRequestConfig) => {
  config.headers = config.headers || {};

  const methodUpper = config.method?.toUpperCase();

  if (methodUpper && methodUpper !== "GET" && methodUpper !== "HEAD") {
    config.headers["X-Requested-By"] = "Appsmith";
  }

  return config;
};
