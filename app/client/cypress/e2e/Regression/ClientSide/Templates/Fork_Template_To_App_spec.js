import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  assertHelper,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Fork a template to the current app",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap"] },
  () => {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      // Closes template dialog if it is already open - useful for retry
      cy.get("body").then(($ele) => {
        if ($ele.find(template.templateDialogBox).length) {
          cy.xpath(template.closeButton).click();
        }
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    });

    it("1. Fork a template to the current app + Bug 17477", () => {
      PageList.AddNewPage("Add page from template");
      // Commented out below code as fetch template call is not going through when template dialog is closed
      // cy.wait("@fetchTemplate").should(
      //   "have.nested.property",
      //   "response.body.responseMeta.status",
      //   200,
      // );
      cy.wait(4000);
      cy.get(template.templateDialogBox).should("be.visible");
      cy.xpath("//h1[text()='Applicant Tracker-test']")
        .scrollIntoView()
        .wait(500)
        .click();
      agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");
      cy.wait(6000);
      cy.get("body").then(($ele) => {
        if ($ele.find(widgetLocators.toastAction).length <= 0) {
          if ($ele.find(template.templateViewForkButton).length > 0) {
            cy.get(template.templateViewForkButton).click();
          }
        }
      });
      cy.get(widgetLocators.toastAction).should(
        "contain",
        "template added successfully",
      );
      assertHelper.AssertNetworkStatus("updateLayout");
      // [Bug]: Getting 'Resource not found' error on deploying template #17477
      deployMode.DeployApp();
      cy.get(".t--page-switch-tab")
        .contains("1 Track Applications")
        .click({ force: true });
      deployMode.NavigateBacktoEditor();
    });

    it("2. Add selected pages from template to an app", () => {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      agHelper.GetNClick(template.startFromTemplateCard);
      // Commented out below code as fetch template call is not going through when template dialog is closed
      // cy.wait("@fetchTemplate").should(
      //   "have.nested.property",
      //   "response.body.responseMeta.status",
      //   200,
      // );
      agHelper.AssertElementVisibility(template.templateDialogBox);
      agHelper.GetNClick("//h1[text()='Applicant Tracker-test']");
      agHelper.FailIfErrorToast(
        "Internal server error while processing request",
      );
      assertHelper.AssertNetworkStatus("getTemplatePages");
      cy.get(template.selectCheckbox).first().click();
      cy.get(template.selectCheckbox).eq(1).click();
      // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
      agHelper.GetNClick(template.templateViewForkButton);
      assertHelper.AssertNetworkStatus("fetchTemplate");
      agHelper.ValidateToastMessage("template added successfully");
      assertHelper.AssertNetworkStatus("updateLayout");
    });
  },
);
