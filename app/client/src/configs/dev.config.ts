import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { STAGE_BASE_URL } from "constants/ApiConstants";
import { AppsmithUIConfigs } from "./types";

const devConfig: AppsmithUIConfigs = {
  sentry: {
    enabled: false,
    config: SENTRY_STAGE_CONFIG,
  },
  hotjar: {
    enabled: false,
  },
  segment: {
    enabled: false,
  },
  apiUrl: "/api/",
  baseUrl: STAGE_BASE_URL,
};

export default devConfig;
