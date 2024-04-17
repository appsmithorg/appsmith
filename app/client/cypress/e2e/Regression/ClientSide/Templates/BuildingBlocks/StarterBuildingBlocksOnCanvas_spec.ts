import template from "../../../../../locators/TemplatesLocators.json";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  dataSources,
  onboarding,
  templates,
} from "../../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

describe(
  "Starter building blocks on canvas",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  function () {
    beforeEach(() => {
      PageList.AddNewPage("New blank page");
      featureFlagIntercept({
        ab_show_templates_instead_of_blank_canvas_enabled: true,
        release_drag_drop_building_blocks_enabled: false,
      });
    });

    it("1. `Connect your data` pop up should come up when we fork a building block from canvas.", function () {
      agHelper.GetNClick(templates.locators._buildingBlockCardOnCanvas);

      agHelper.WaitUntilEleDisappear("Importing template");
      agHelper.AssertElementVisibility(
        templates.locators._datasourceConnectPromptSubmitBtn,
      );
      agHelper.GetNClick(templates.locators._datasourceConnectPromptSubmitBtn);
      cy.url().should("include", "datasources/NEW");
    });

    it("2. `See more` functionality should filter `Building blocks` in add a page from templates modal", function () {
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
