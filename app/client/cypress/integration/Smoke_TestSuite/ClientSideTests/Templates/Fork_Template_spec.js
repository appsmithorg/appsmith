const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");

describe("Fork a template to an workspace", () => {
  it("Fork a template to an workspace", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.get(templateLocators.templateForkButton)
      .first()
      .click();

    cy.get(templateLocators.dialogForkButton).click();
    cy.get(commonlocators.canvas).should("be.visible");
  });
});
