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
];

export const PREMIUM_INTEGRATION_CONTACT_FORM =
  "PREMIUM_INTEGRATION_CONTACT_FORM";
