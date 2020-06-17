const datasource = require("../../../locators/DatasourcesEditor.json");
let pageid;

describe("Create, test, save then delete a mongo datasource", function() {
  it("Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.testSaveDeleteDatasource();
  });
});
