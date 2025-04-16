import PluginsApi from "api/PluginApi";
import type { PremiumIntegration } from "api/PluginApi";
import log from "loglevel";

// Re-export the PremiumIntegration type
export type { PremiumIntegration };

// Store the fetched integrations
const PREMIUM_INTEGRATIONS: PremiumIntegration[] = [];

// Initialize by fetching integrations
PluginsApi.fetchPremiumIntegrations([])
  .then((integrations) => {
    // Clear the array and push new items
    PREMIUM_INTEGRATIONS.length = 0;
    PREMIUM_INTEGRATIONS.push(...integrations);
  })
  .catch((error) => {
    log.error("Failed to fetch premium integrations:", error);
  });

/**
 * Filters premium integrations based on available plugins.
 * Returns cached integrations synchronously.
 *
 * @param isExternalSaasEnabled Whether external SaaS integrations are enabled
 * @param pluginNames List of installed plugin names (lowercase)
 * @returns Filtered list of premium integrations
 */
export const getFilteredPremiumIntegrations = (
  isExternalSaasEnabled: boolean,
  pluginNames: string[],
): PremiumIntegration[] => {
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
