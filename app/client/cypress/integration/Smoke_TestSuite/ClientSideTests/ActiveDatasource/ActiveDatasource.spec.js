const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let datasourceName, actionName;
describe("Google Sheet datasource test cases", function() {
  before(() => {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.googleSheets).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillGoogleSheetsDatasourceForm();
    cy.get("@createDatasource").then((httpResponse) => {
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
      `.t--datasource-name:contains('${datasourceName}') .t--queries-for-SAAS`,
    ).should("have.text", "1 query on this page");
  });

  after(() => {
    cy.get(`.t--entity-name:contains('${actionName}')`).click();
    cy.get(queryEditor.queryMoreAction).click();
    cy.get(queryEditor.deleteUsingContext).click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.deleteDatasource(datasourceName);
  });
});
