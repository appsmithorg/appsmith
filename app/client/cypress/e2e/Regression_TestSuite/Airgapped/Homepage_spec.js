const templateLocators = require("../../../locators/TemplatesLocators.json");
describe("airgap", "Airgapped homepage", () => {
  it("1. Template tabs shouldn't exist", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).should("not.exist");
  });
});
