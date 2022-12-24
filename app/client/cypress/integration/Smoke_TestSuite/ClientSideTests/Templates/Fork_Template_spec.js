const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");

describe("Fork a template to an workspace", () => {
  it("Fork a template to an workspace", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.wait(1000);
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.get(templateLocators.dialogForkButton).click();
    cy.get(commonlocators.canvas).should("be.visible");
  });
  it("Update query param on opening fork modal in template detailed view", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.get(templateLocators.templateCard)
      .first()
      .click();
    cy.get(templateLocators.templateViewForkButton).click();
    cy.location().should((location) => {
      expect(location.search).to.eq("?showForkTemplateModal=true");
    });
  });
});
