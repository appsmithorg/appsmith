import type { InternalAxiosRequestConfig } from "axios";

export const addAnonymousUserIdHeader = (
  config: InternalAxiosRequestConfig,
  options: { anonymousId?: string; segmentEnabled?: boolean },
) => {
  const { anonymousId, segmentEnabled } = options;

  config.headers = config.headers || {};

  if (segmentEnabled && anonymousId) {
    config.headers["x-anonymous-user-id"] = anonymousId;
  }

  return config;
};
