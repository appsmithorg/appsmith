import {
  SENTRY_PROD_CONFIG,
  HOTJAR_PROD_HJID,
  HOTJAR_PROD_HJSV,
} from "constants/ThirdPartyConstants";
import { AppsmithUIConfigs } from "./types";
import { FeatureFlagEnum } from "utils/featureFlags";

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
  featureFlags: [
    FeatureFlagEnum.ApiPaneV2,
    FeatureFlagEnum.DatasourcePane,
    FeatureFlagEnum.QueryPane,
  ],
});

export default prodConfig;
