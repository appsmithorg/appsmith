const templateLocators = require("../../../locators/TemplatesLocators.json");
import { homePage } from "../../../support/Objects/ObjectsCore";
describe("airgap", "Airgapped homepage", () => {
  it("1. Template tabs shouldn't exist", () => {
    homePage.NavigateToHome();
    cy.get(templateLocators.templatesTab).should("not.exist");
  });
});
