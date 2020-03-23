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
  apiUrl: "/api/",
  baseUrl,
  logLevel: "debug",
});

export default devConfig;
