const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Create a query with a empty datasource, run, save the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a empty datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.testSaveDatasource(false);
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("2. Create a query for empty/incorrect datasource and validate", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users limit 10");

    cy.EvaluateCurrentValue("select * from users limit 10");
    cy.runQuery(false);
    cy.get(".t--query-error").contains(
      "[Missing endpoint., Missing username for authentication., Missing password for authentication.]",
    );
  });
});
