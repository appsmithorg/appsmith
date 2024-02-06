import template from "../../../../locators/TemplatesLocators.json";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  dataSources,
  templates,
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
      homePage.LogOutviaAPI();
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

    it("1. onboarding flow - should check page entity selection in explorer", function () {
      agHelper.GetNClick(onboarding.locators.seeMoreButtonOnCanvas, 0, true);

      agHelper.AssertElementVisibility(template.templateDialogBox);

      const filterItemWrapper = agHelper.GetElement(".filter-wrapper");

      const templateFilterItemSelectedIcon = filterItemWrapper.find(
        templates.locators._templateFilterItemSelectedIcon,
      );
      templateFilterItemSelectedIcon.should("have.length", 1);
      templateFilterItemSelectedIcon
        .first()
        .prev()
        .should("have.text", "Building Blocks");
      agHelper.GetNClick(template.closeButton);
    });

    // it("2. `Connect your data` pop up should come up when we fork a building block from canvas.", function () {
    //   agHelper.GetNClick(templates.locators._buildingBlockCardOnCanvas);

    //   agHelper.WaitUntilEleDisappear("Importing template");
    //   agHelper.AssertElementVisibility(
    //     templates.locators._datasourceConnectPromptSubmitBtn,
    //   );
    //   agHelper.GetNClick(templates.locators._datasourceConnectPromptSubmitBtn);
    //   cy.url().should("include", "datasources/NEW");
    // });

    // it("3. `Connect your data` pop up should NOT come up when user already has a datasource.", function () {
    //   dataSources.CreateMockDB("Users");
    //   AppSidebar.navigate(AppSidebarButton.Editor);

    //   agHelper.GetNClick(templates.locators._buildingBlockCardOnCanvas, 0);

    //   agHelper.WaitUntilEleDisappear("Importing template");

    //   agHelper.AssertElementAbsence(
    //     templates.locators._datasourceConnectPromptSubmitBtn,
    //     4000,
    //   );
    // });
  },
);
