const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a MySQL datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create, test, save then delete a MySQL datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.Mysql).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMySQLDatasourceForm();
    cy.testSaveDeleteDatasource();
  });

  it("Create, test, save then delete a MySQL datasource when trailing spaces are added to host and DB name", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.Mysql).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMySQLDatasourceForm(true);
    cy.testSaveDeleteDatasource();
  });
});
