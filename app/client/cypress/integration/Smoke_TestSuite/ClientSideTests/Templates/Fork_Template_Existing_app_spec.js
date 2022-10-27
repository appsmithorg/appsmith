import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Fork a template to the current app from new page popover", () => {
  it("1. Fork template from page section", () => {
    cy.AddPageFromTemplate();
    cy.wait(3000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.wait(4000);
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.wait(1000);
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });

  it("2. Add selected page of template from page section", () => {
    cy.AddPageFromTemplate();
    cy.wait(3000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.wait(4000);
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .click();
    cy.xpath("//span[text()='DASHBOARD']")
      .parent()
      .next()
      .click();
    cy.get(template.templateViewForkButton).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});
