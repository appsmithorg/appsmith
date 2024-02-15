const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Fork a template to an workspace",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  () => {
    beforeEach(() => {
      _.homePage.Signout();
      featureFlagIntercept({ ab_create_new_apps_enabled: true }, false);
      cy.generateUUID().then((uid) => {
        _.homePage.SignUp(`${uid}@appsmithtest.com`, uid);
        _.onboarding.closeIntroModal();
      });
      _.agHelper.GetNClick(templateLocators.startFromTemplateOnboardingCard);
      _.agHelper.AssertElementVisibility(
        _.locators._visibleTextSpan("Select a template"),
      );
      _.agHelper.AssertElementAbsence(
        _.locators._visibleTextSpan("Loading templates"),
        Cypress.config().pageLoadTimeout,
      );
      _.agHelper.AssertElementVisibility(templateLocators.templateLoadState);
    });

    it("1. Fork a template to an workspace during onboarding should open the template in an application", () => {
      _.agHelper.GetNClick(templateLocators.templateCard);
      _.agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      _.assertHelper.AssertNetworkStatus("templatePreview");
      _.agHelper.GetNClick(templateLocators.templateViewForkButton);
      _.agHelper.WaitUntilEleAppear(commonlocators.canvas);
    });
  },
);
