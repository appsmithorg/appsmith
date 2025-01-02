import {
  agHelper,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";
import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Admin Branding Page - Branding page validations",
  { tags: ["@tag.Settings"] },
  () => {
    it("1. Verify branding data update for community user", () => {
      featureFlagIntercept({ license_branding_enabled: true });
      adminSettings.NavigateToAdminSettings();
    });
  },
);
