import { SENTRY_STAGE_CONFIG } from "constants/ThirdPartyConstants";
import { AppsmithUIConfigs } from "./types";

const devConfig = (baseUrl: string): AppsmithUIConfigs => ({
  sentry: {
    enabled: false,
    config: SENTRY_STAGE_CONFIG,
  },
  hotjar: {
    enabled: false,
  },
  segment: {
    enabled: false,
    key: "NZALSCjsaxOIyprzITLz2yZwFzQynGt1",
  },
  featureFlag: {
    remoteConfig: {
      optimizely: "PVDSYRhBhvUVY3tN6mkV1s",
    },
    default: {
      documentationv2: true,
      apipanev2: true,
      datasourcepane: true,
      querypane: true,
    },
  },
  apiUrl: "/api/",
  baseUrl,
  logLevel: "debug",
});

export default devConfig;
