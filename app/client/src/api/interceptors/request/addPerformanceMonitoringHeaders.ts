import type { InternalAxiosRequestConfig } from "axios";

export const addPerformanceMonitoringHeaders = (
  config: InternalAxiosRequestConfig,
) => {
  config.headers = config.headers || {};
  config.headers["timer"] = performance.now();

  return config;
};
