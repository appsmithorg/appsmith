import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

let appId, newWorkspaceName;

describe("excludeForAirgap", "Fork a template to the current app", () => {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
    // Closes template dialog if it is already open - useful for retry
    cy.get("body").then(($ele) => {
      if ($ele.find(template.templateDialogBox).length) {
        cy.xpath(template.closeButton).click();
      }
    });
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains(Page1)`)
      .trigger("mouseover")
      .click({ force: true });
  });

  it("1. Fork a template to the current app + Bug 17477", () => {
    cy.wait(3000);
    _.entityExplorer.AddNewPage("Add page from template");
    // Commented out below code as fetch template call is not going through when template dialog is closed
    // cy.wait("@fetchTemplate").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    cy.wait(4000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//h1[text()='Applicant Tracker-test']/parent::div//button[contains(@class, 't--fork-template')]",
    )
      .scrollIntoView()
      .wait(500)
      .click();
    _.agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
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
    _.assertHelper.AssertNetworkStatus("updateLayout");
    // [Bug]: Getting 'Resource not found' error on deploying template #17477
    _.deployMode.DeployApp();
    cy.get(".t--page-switch-tab")
      .contains("1 Track Applications")
      .click({ force: true });
    cy.wait(4000);
    _.deployMode.NavigateBacktoEditor();
    cy.wait(2000);
  });

  it("2. Add selected pages from template to an app", () => {
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains(Page1)`)
      .trigger("mouseover")
      .click({ force: true });
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
    _.agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
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
    cy.get(widgetLocators.toastAction, { timeout: 40000 }).should(
      "contain",
      "template added successfully",
    );
    _.assertHelper.AssertNetworkStatus("updateLayout");
  });
});
