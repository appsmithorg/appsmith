import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let appId, newWorkspaceName;

describe("Fork a template to the current app", () => {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
    // Closes template dialog if it is already open - useful for retry
    cy.get("body").then(($ele) => {
      if ($ele.find(template.templateDialogBox).length) {
        cy.get(template.closeButton).click();
      }
    });
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains(Page1)`)
      .trigger("mouseover")
      .click({ force: true });
  });

  it("1. Fork a template to the current app + Bug 17477", () => {
    cy.wait(5000);
    cy.get(template.startFromTemplateCard).click();
    // Commented out below code as fetch template call is not going through when template dialog is closed
    // cy.wait("@fetchTemplate").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Applicant Tracker-test']/parent::div//button[contains(@class, 't--fork-template')]",
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
    // [Bug]: Getting 'Resource not found' error on deploying template #17477
    cy.PublishtheApp();
    cy.get(".t--page-switch-tab")
      .contains("1 Track Applications")
      .click({ force: true });
    cy.wait(4000);
    cy.get(publish.backToEditor).click();
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
    cy.xpath("//div[text()='Applicant Tracker-test']").click();
    _.agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages).next().click();
    cy.wait(1000);
    cy.xpath("//span[text()='2 APPLICATION UPLOAD']").parent().next().click();
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
  });
});
