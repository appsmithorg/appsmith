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
  {
    tags: [
      "@tag.Templates",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
    ],
  },
  () => {
    it("1. Fork a template to the current app + Bug 17477", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.GetNClick(template.templateCard, 0, true);
      agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      agHelper.GetNClick(template.templateViewForkButton);
      agHelper.WaitUntilToastDisappear("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");
      PageList.AddNewPage("Generate page with data");
      deployMode.DeployApp();
      agHelper.GetNClick(locators._deployedPage, 0, true);
      deployMode.NavigateBacktoEditor();
      homePage.NavigateToHome();
      agHelper.WaitUntilAllToastsDisappear();
    });

    it("2. Add selected pages from template to an app", () => {
      homePage.CreateNewApplication();
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.GetNClick(template.templateCard, 0, true);
      agHelper.FailIfErrorToast(
        "Internal server error while processing request",
      );
      assertHelper.AssertNetworkStatus("getTemplatePages");
      agHelper.CheckUncheck(template.selectAllPages, false);
      agHelper.GetNClick(template.selectCheckbox, 1);
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
