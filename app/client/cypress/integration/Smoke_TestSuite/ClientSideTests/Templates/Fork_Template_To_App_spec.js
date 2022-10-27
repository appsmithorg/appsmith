import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Fork a template to the current app", () => {
  it("1. Fork a template to the current app", () => {
    cy.get(template.startFromTemplateCard).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
    // [Bug]: Getting 'Resource not found' error on deploying template #17477
    cy.PublishtheApp();
    cy.get(".t--page-switch-tab")
      .contains("Dashboard")
      .click({ force: true });
    cy.wait(4000);
    cy.get(publish.backToEditor).click();
    cy.wait(2000);
  });

  it("2. Add selected pages from template to an app", () => {
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains(Page1)`)
      .trigger("mouseover")
      .click({ force: true });
    cy.wait(1000);
    cy.get(template.startFromTemplateCard).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .click();
    cy.wait(1000);
    cy.xpath("//span[text()='SEARCH']")
      .parent()
      .next()
      .click();
    // [Bug]: On forking selected pages from a template, resource not found error is shown #17270
    cy.get(template.templateViewForkButton).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});
