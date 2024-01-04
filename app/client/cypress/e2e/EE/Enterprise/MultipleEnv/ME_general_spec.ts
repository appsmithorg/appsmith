import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  multipleEnv,
  agHelper,
  dataManager,
} from "../../../../support/ee/ObjectsCore_EE";

let prodEnv: string, stagingEnv: string;

describe(
  "Tests general functionality of multi environment",
  { tags: ["@tag.Datasource", "@tag.excludeForAirgap"] },
  function () {
    before(() => {
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      prodEnv = dataManager.defaultEnviorment;
      stagingEnv = dataManager.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
    });

    it("1. Check environment switcher state", function () {
      // Make sure the environment switcher is visible
      cy.get(multipleEnv.env_switcher).should("be.visible");
      // Make sure the environment switcher is enabled
      agHelper.AssertAttribute(
        multipleEnv.env_switcher,
        "aria-disabled",
        "false",
      );
      // Check if both environments are present in the dropdown
      agHelper.GetNClick(multipleEnv.env_switcher);
      agHelper.AssertSelectedTab(
        multipleEnv.env_switcher_dropdown_opt_prod,
        "true",
      );
      agHelper.AssertSelectedTab(
        multipleEnv.env_switcher_dropdown_opt_stage,
        "false",
      );
    });
    it("2. Ramps should visible when feature flag is false ", function () {
      featureFlagIntercept({ release_datasource_environments_enabled: false });
      agHelper.GetNClick(multipleEnv.env_switcher);
      agHelper.GetNClick(multipleEnv.env_switcher_dropdown_opt_stage);
      agHelper.GetNAssertContains(
        multipleEnv.ds_data_dropdown_tooltip,
        "To access environments for datasources",
      );
    });
  },
);
