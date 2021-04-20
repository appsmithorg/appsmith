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
    cy.testDatasource();

    cy.get(".t--save-datasource").click();

    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      cy.log(datasourceName);
      cy.NavigateToQueryEditor();
      cy.get(".t--datasource-name:contains(".concat(datasourceName).concat(")"))
        .find(queryLocators.createQuery)
        .click({ force: true });
    });
  });

  it("Create a query for empty/incorrect datasource and validate", () => {
    cy.get(queryLocators.templateMenu)
      .first()
      .click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users limit 10");

    cy.EvaluateCurrentValue("select * from users limit 10");
    cy.runQuery();
    cy.get(".react-tabs p")
      .last()
      .contains(
        "[Missing endpoint., Missing username for authentication., Missing password for authentication.]",
      );
  });
});
