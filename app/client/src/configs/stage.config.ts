import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { STAGE_BASE_URL } from "constants/ApiConstants";
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
  apiUrl: "/api/",
  baseUrl: STAGE_BASE_URL,
};

export default stageConfig;
