import {
  SENTRY_PROD_CONFIG,
  HOTJAR_PROD_HJID,
  HOTJAR_PROD_HJSV,
} from "constants/ThirdPartyConstants";
import { AppsmithUIConfigs } from "./types";

export const prodConfig = (baseUrl: string): AppsmithUIConfigs => ({
  sentry: {
    enabled: true,
    config: SENTRY_PROD_CONFIG,
  },
  hotjar: {
    enabled: true,
    config: {
      id: HOTJAR_PROD_HJID,
      sv: HOTJAR_PROD_HJSV,
    },
  },
  segment: {
    enabled: true,
    key: "O7rsLdWq7fhJI9rYsj1eatGAjuULTmfP",
  },
  apiUrl: "/api/",
  baseUrl,
  logLevel: "error",
  featureFlag: {
    remoteConfig: {
      optimizely: "Jq3K2kVdvuvxecHyHbVYcj",
    },
    default: {
      documentationv2: true,
      apipanev2: true,
      datasourcepane: true,
      querypane: true,
    },
  },
});

export default prodConfig;
