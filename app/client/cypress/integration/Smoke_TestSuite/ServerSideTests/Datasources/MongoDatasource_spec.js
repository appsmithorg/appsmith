const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a mongo datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.testSaveDeleteDatasource();
  });

  it("Create with trailing white spaces in host address and database name, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm(true); //fills form with trailing white spaces
    cy.testSaveDeleteDatasource();
  });
});
