import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  templates,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Start with scratch userflow",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  function () {
    beforeEach(() => {
      homePage.Signout(true);
      featureFlagIntercept(
        {
          ab_show_templates_instead_of_blank_canvas_enabled: true,
          ab_create_new_apps_enabled: true,
        },
        false,
      );
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

    it("2. `Connect your data` pop up should come up when we fork a building block from canvas.", function () {
      agHelper.GetNClick(templates.locators._buildingBlockCardOnCanvas);

      agHelper.WaitUntilEleDisappear("Importing template");
      agHelper.AssertElementVisibility(
        templates.locators._datasourceConnectPromptSubmitBtn,
      );
      agHelper.GetNClick(templates.locators._datasourceConnectPromptSubmitBtn);
      cy.url().should("include", "datasources/NEW");
    });
  },
);
