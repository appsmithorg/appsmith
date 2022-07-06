const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");

let datasourceName, actionName;
describe("Mongo Active datasource test cases", function() {
  before(() => {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.get(datasourceEditor.saveBtn).click({ force: true });
    cy.wait("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      cy.NavigateToActiveDSQueryPane(datasourceName);
    });
    cy.wait("@createNewApi").then((httpResponse) => {
      actionName = httpResponse.response.body.data.name;
    });
    cy.NavigateToApiEditor();
  });

  it("Create a new query from the datasource editor", function() {
    cy.NavigateToActiveTab();
    cy.get(
      `.t--datasource-name:contains('${datasourceName}') .t--queries-for-DB`,
    ).should("have.text", "1 query on this page");
  });

  after(() => {
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.get(`.t--entity-name:contains('${actionName}')`).click();
    cy.deleteQueryUsingContext();
    cy.deleteDatasource(datasourceName);
  });
});
