import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "../../../../constants/ThirdPartyConstants";
import PluginsApi from "api/PluginApi";
import type { UpcomingIntegration } from "api/PluginApi";

export interface PremiumIntegration {
  name: string;
  icon: string;
}

// Hardcoded integrations as fallback
const DEFAULT_PREMIUM_INTEGRATIONS: PremiumIntegration[] = [
  {
    name: "Zendesk",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/zendesk-icon.png`),
  },
  {
    name: "Salesforce",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/salesforce-image.png`),
  },
  {
    name: "Slack",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/slack.png`),
  },
  {
    name: "Jira",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/jira.png`),
  },
];

// Store the fetched integrations
let PREMIUM_INTEGRATIONS: PremiumIntegration[] = [
  ...DEFAULT_PREMIUM_INTEGRATIONS,
];

// Function to fetch and update premium integrations
export const fetchPremiumIntegrations = async (): Promise<
  PremiumIntegration[]
> => {
  try {
    const response = await PluginsApi.fetchUpcomingIntegrations();

    if (response.data.responseMeta.success && response.data.data.length > 0) {
      // Map API response to PremiumIntegration format
      const integrations = response.data.data.map(
        (integration: UpcomingIntegration) => ({
          name: integration.name,
          icon: integration.iconLocation,
        }),
      );

      // Update the global variable
      PREMIUM_INTEGRATIONS = integrations;

      return integrations;
    }

    return DEFAULT_PREMIUM_INTEGRATIONS;
  } catch (error) {
    // Silently handle error and return default integrations
    return DEFAULT_PREMIUM_INTEGRATIONS;
  }
};

// Initialize by fetching integrations
fetchPremiumIntegrations().catch(() => {
  /* Silently handle error */
});

export const getFilteredPremiumIntegrations = (
  isExternalSaasEnabled: boolean,
  pluginNames: string[],
) => {
  return isExternalSaasEnabled
    ? PREMIUM_INTEGRATIONS.filter(
        (integration) =>
          !pluginNames.includes(integration.name.toLocaleLowerCase()),
      )
    : PREMIUM_INTEGRATIONS;
};

export const PREMIUM_INTEGRATION_CONTACT_FORM =
  "PREMIUM_INTEGRATION_CONTACT_FORM";

export const SCHEDULE_CALL_URL =
  "https://calendly.com/carina-neves-fonseca/appsmith";
