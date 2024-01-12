import template from "../../../../locators/TemplatesLocators.json";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  onboarding,
  templates,
} from "../../../../support/Objects/ObjectsCore";

describe("Start with scratch userflow", function () {
  before(() => {
    featureFlagIntercept({
      ab_show_templates_instead_of_blank_canvas_enabled: true,
      ab_create_new_apps_enabled: true,
    });
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      (cy as any).Signup(`${uid}@appsmithtest.com`, uid);
    });
  });

  it("1. onboarding flow - should check page entity selection in explorer", function () {
    agHelper.GetNClick(onboarding.locators.startFromScratchCard);
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
});
