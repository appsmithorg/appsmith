import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { AppsmithUIConfigs } from "./types";

const stageConfig = (baseUrl: string): AppsmithUIConfigs => ({
  sentry: {
    enabled: true,
    config: SENTRY_STAGE_CONFIG,
  },
  hotjar: {
    enabled: false,
  },
  segment: {
    enabled: true,
    key: "NZALSCjsaxOIyprzITLz2yZwFzQynGt1",
  },
  apiUrl: "/api/",
  baseUrl,
  logLevel: "info",
});

export default stageConfig;
