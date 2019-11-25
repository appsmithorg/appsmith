import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { STAGE_BASE_API_URL } from "constants/ApiConstants";
import { AppsmithUIConfigs } from "./types";

const stageConfig: AppsmithUIConfigs = {
  sentry: {
    enabled: true,
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

export default stageConfig;
