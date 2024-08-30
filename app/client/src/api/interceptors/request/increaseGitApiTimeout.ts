import type { InternalAxiosRequestConfig } from "axios";

export const increaseGitApiTimeout = (config: InternalAxiosRequestConfig) => {
  if (config.url?.indexOf("/git/") !== -1) {
    config.timeout = 1000 * 120;
  }

  return config;
};
