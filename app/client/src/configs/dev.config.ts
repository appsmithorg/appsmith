import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { STAGE_BASE_API_URL } from "constants/ApiConstants";
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
  apiUrl: STAGE_BASE_API_URL,
};

export default devConfig;
