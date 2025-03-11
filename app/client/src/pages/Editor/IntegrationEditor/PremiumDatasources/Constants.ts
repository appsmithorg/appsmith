import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "../../../../constants/ThirdPartyConstants";

export interface PremiumIntegration {
  name: string;
  icon: string;
}

const PREMIUM_INTEGRATIONS: PremiumIntegration[] = [
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
