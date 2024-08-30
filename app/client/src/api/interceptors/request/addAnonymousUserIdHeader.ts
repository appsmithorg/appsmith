import type { InternalAxiosRequestConfig } from "axios";
import { getAppsmithConfigs } from "ee/configs";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const appsmithConfig = getAppsmithConfigs();

export const addAnonymousUserIdHeader = (
  config: InternalAxiosRequestConfig,
) => {
  config.headers = config.headers || {};
  const anonymousId = AnalyticsUtil.getAnonymousId();

  if (appsmithConfig.segment.enabled && anonymousId) {
    config.headers["x-anonymous-user-id"] = anonymousId;
  }

  return config;
};
