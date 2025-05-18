import type { UpcomingIntegration } from "entities/Plugin";

/**
 * Filters upcoming integrations based on available plugins.
 * Returns cached integrations synchronously.
 *
 * @param isExternalSaasEnabled Whether external SaaS integrations are enabled
 * @param pluginNames List of installed plugin names (lowercase)
 * @returns Filtered list of upcoming integrations
 */
export const getFilteredUpcomingIntegrations = (
  isExternalSaasEnabled: boolean,
  pluginNames: string[],
  upcomingPlugins: UpcomingIntegration[],
): UpcomingIntegration[] => {
  return isExternalSaasEnabled
    ? upcomingPlugins.filter(
        (integration) =>
          !pluginNames.includes(integration.name.toLocaleLowerCase()),
      )
    : upcomingPlugins;
};

export const PREMIUM_INTEGRATION_CONTACT_FORM =
  "PREMIUM_INTEGRATION_CONTACT_FORM";

export const SCHEDULE_CALL_URL =
  "https://calendly.com/carina-neves-fonseca/appsmith";
