const datasource = require("../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a postgres datasource", function() {
  it("Create, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDeleteDatasource();
  });
});
