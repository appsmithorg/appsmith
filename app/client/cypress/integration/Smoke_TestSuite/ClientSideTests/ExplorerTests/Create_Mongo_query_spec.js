const explorerLocators = require("../../../../locators/explorerlocators.json");
const datasourceLocators = require("../../../../locators/DatasourcesEditor.json");
const omnibarLocators = require("../../../../locators/Omnibar.json");

describe("Create a mongo query from explorer", () => {
  it("Create a mongo query from explorer when actively on a mongo query page", () => {
    cy.get(explorerLocators.addEntityAPI).click();
    cy.createMockDatasource("Movies");
    cy.get(datasourceLocators.datasourceCard)
      .contains("Movies")
      .get(datasourceLocators.createQuerty)
      .first()
      .click();
    cy.get(explorerLocators.createQueryMenu).click();
    cy.get(omnibarLocators.createNew)
      .contains("Movies Query")
      .click();
    cy.get(".react-tabs__tab-panel--selected")
      .contains("Commands")
      .click();
  });
});
