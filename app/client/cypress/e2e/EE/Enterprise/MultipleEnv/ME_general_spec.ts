import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  deployMode,
  dataManager,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import { multipleEnv } from "../../../../support/ee/ObjectsCore_EE";

let prodEnv: string, stagingEnv: string;

describe(
  "excludeForAirgap",
  "Tests general functionality of multi environment",
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

    it("2. Check for deploy modal for env enabled workspaces", function () {
      deployMode.DeployApp(
        locators._emptyPageTxt,
        true,
        true,
        true,
        "present",
        true,
      );
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      agHelper.GetNAssertContains(
        locators._emptyPageTxt,
        "This page seems to be blank",
      );
      deployMode.NavigateBacktoEditor();
      deployMode.DeployApp(locators._emptyPageTxt, true, true, true, "absent");
    });
  },
);
