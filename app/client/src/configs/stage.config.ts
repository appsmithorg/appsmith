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
  featureFlag: {
    remoteConfig: {
      optimizely: "2qP3XSwgM9pHYTEYbtbAQx",
    },
    default: {
      documentationv2: true,
      apipanev2: true,
      datasourcepane: true,
      querypane: true,
      lightningmenu: true,
    },
  },
  apiUrl: "/api/",
  baseUrl,
  logLevel: "info",
});

export default stageConfig;
