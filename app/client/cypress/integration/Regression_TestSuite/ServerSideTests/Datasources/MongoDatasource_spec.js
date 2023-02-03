const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Create, test, save then delete a mongo datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.fillMongoDatasourceForm();
    cy.testSaveDeleteDatasource();
  });

  it("2. Create with trailing white spaces in host address and database name, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.fillMongoDatasourceForm(true); //fills form with trailing white spaces
    cy.testSaveDeleteDatasource();
  });
});
