const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Create a query with a empty datasource, run, save the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a empty datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.testSaveDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Create a query for empty/incorrect datasource and validate", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users limit 10");

    cy.EvaluateCurrentValue("select * from users limit 10");
    cy.runQuery();
    cy.get(".t--query-error").contains(
      "[Missing endpoint., Missing username for authentication., Missing password for authentication.]",
    );
  });
});
