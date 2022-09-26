import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";

describe("Fork a template to the current app", () => {
  it("1. Fork a template to the current app", () => {
    cy.get(template.startFromTemplateCard).click();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });

  it("2. Add selected pages from template to an app", () => {
    cy.get(template.startFromTemplateCard).click();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@importTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .uncheck();
    cy.xpath("//span[text()='DASHBOARD']")
      .parent()
      .next()
      .check();
    cy.get(template.templateViewForkButton).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });

  it("3. Fork template from page section", () => {
    cy.AddPageFromTemplate();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });

  it("4. Add selected page of template from page section", () => {
    cy.AddPageFromTemplate();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@importTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .uncheck();
    cy.xpath("//span[text()='DASHBOARD']")
      .parent()
      .next()
      .check();
    cy.get(template.templateViewForkButton).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});
