const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a user mock datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create, test, save then delete a user mock datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.mockUserDatabase).click();
    cy.get(datasource.mockUserDatasources)
      .last()
      .click({ force: true });
    cy.fillUsersMockDatasourceForm();
    cy.testSaveDeleteDatasource();
  });

  it("Create with whitespaces in host address and database name, test, save then delete a user mock datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.mockUserDatabase).click();
    cy.get(datasource.mockUserDatasources)
      .last()
      .click({ force: true });
    cy.fillUsersMockDatasourceForm(true);
    cy.testSaveDeleteDatasource();
  });
});
