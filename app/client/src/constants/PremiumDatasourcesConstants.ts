import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "./ThirdPartyConstants";

interface PremiumIntegration {
  name: string;
  icon: string;
}

export const PREMIUM_INTEGRATIONS: PremiumIntegration[] = [
  {
    name: "Zendesk",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/zendesk-icon.png`),
  },
  {
    name: "Salesforce",
    icon: getAssetUrl(`${ASSETS_CDN_URL}/salesforce-icon.png`),
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

export const PREMIUM_INTEGRATION_CONTACT_FORM =
  "PREMIUM_INTEGRATION_CONTACT_FORM";

export const SCHEDULE_CALL_URL =
  "https://calendly.com/carina-neves-fonseca/appsmith";
