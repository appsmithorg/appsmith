import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import {
  agHelper,
  assertHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe("excludeForAirgap", "Fork a template to the current app", () => {
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
    cy.wait(3000);
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
    agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
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
    cy.wait(4000);
    deployMode.NavigateBacktoEditor();
    cy.wait(2000);
  });

  it("2. Add selected pages from template to an app", () => {
    cy.wait(5000);
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    cy.wait(1000);
    cy.get(template.startFromTemplateCard).click();
    // Commented out below code as fetch template call is not going through when template dialog is closed
    // cy.wait("@fetchTemplate").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//h1[text()='Applicant Tracker-test']").click();
    agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(template.selectCheckbox).first().click();
    cy.wait(1000);
    cy.get(template.selectCheckbox).eq(1).click();
    // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
    cy.get(template.templateViewForkButton).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction, { timeout: 50000 }).should(
      "contain",
      "template added successfully",
    );
    assertHelper.AssertNetworkStatus("updateLayout");
  });
});
