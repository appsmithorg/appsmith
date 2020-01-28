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
  },
  apiUrl: "/api/",
  baseUrl,
});

export default prodConfig;
