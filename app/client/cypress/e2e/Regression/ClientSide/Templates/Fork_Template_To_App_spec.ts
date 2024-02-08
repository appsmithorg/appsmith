import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Fork a template to the current app",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap"] },
  () => {
    it("1. Fork a template to the current app + Bug 17477", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.GetNClick("//h1[text()='Applicant Tracker-test']");
      agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.WaitUntilToastDisappear("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");
      // [Bug]: Getting 'Resource not found' error on deploying template #17477
      deployMode.DeployApp();
      agHelper.GetNClickByContains(
        ".t--page-switch-tab",
        "1 Track Applications",
      );
      deployMode.NavigateBacktoEditor();
      homePage.NavigateToHome();
      agHelper.WaitUntilAllToastsDisappear();
    });

    it("2. Add selected pages from template to an app", () => {
      homePage.CreateNewApplication();
      agHelper.GetNClick(template.startFromTemplateCard);
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.GetNClick("//h1[text()='Applicant Tracker-test']");
      agHelper.FailIfErrorToast(
        "Internal server error while processing request",
      );
      assertHelper.AssertNetworkStatus("getTemplatePages");
      agHelper.CheckUncheck(template.selectAllPages, false);
      agHelper.GetNClick(template.selectCheckbox, 1);
      // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.AssertElementAbsence(
        locators._visibleTextSpan("Setting up the template"),
        Cypress.config().pageLoadTimeout,
      );
      assertHelper.AssertNetworkStatus("fetchTemplate");
      agHelper.ValidateToastMessage("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");
    });
  },
);
