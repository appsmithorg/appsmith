const datasourceEditor = require("../../../locators/DatasourcesEditor.json");
const datasourceFormData = require("../../../fixtures/datasources.json");

describe("Create, test, save then delete a restapi datasource", function() {
  it("Create, test, save then delete a restapi datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.RESTAPI).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.get(datasourceEditor.url).type(datasourceFormData["restapi-url"]);
    cy.testSaveDeleteDatasource();
  });
});
