import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  templates,
  dataSources,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Start with scratch userflow",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  function () {
    before(() => {
      homePage.Signout(true);
      featureFlagIntercept({
        ab_show_templates_instead_of_blank_canvas_enabled: true,
        ab_create_new_apps_enabled: true,
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.SignUp(`${uid}@appsmithtest.com`, uid as unknown as string);
      });
      agHelper.GetNClick(onboarding.locators.startFromScratchCard);
      onboarding.closeIntroModal();
      featureFlagIntercept({
        ab_show_templates_instead_of_blank_canvas_enabled: true,
      });
      agHelper.AssertElementLength(
        templates.locators._buildingBlockCardOnCanvas,
        3,
      );
    });

    it("3. `Connect your data` pop up should NOT come up when user already has a datasource.", function () {
      dataSources.CreateMockDB("Users");
      AppSidebar.navigate(AppSidebarButton.Editor);

      agHelper.GetNClick(templates.locators._buildingBlockCardOnCanvas, 0);

      agHelper.WaitUntilEleDisappear("Importing template");

      agHelper.AssertElementAbsence(
        templates.locators._datasourceConnectPromptSubmitBtn,
        4000,
      );
    });
  },
);
