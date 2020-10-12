const queryLocators = require("../../../locators/QueryEditor.json");
const datasource = require("../../../locators/DatasourcesEditor.json");

let datasourceName;

describe("Create a query with a postgres datasource, run, save and then delete the query", function() {
  it("Create a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });
  it("Create, runs and delete a query", () => {
    cy.NavigateToQueryEditor();
    cy.get(".t--datasource-name")
      .contains(datasourceName)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from users limit 10");

    cy.EvaluateCurrentValue("select * from users limit 10");
    cy.runAndDeleteQuery();
  });
  it("Create, runs and delete another query", () => {
    cy.NavigateToQueryEditor();
    cy.get(".t--datasource-name")
      .contains(datasourceName)
      .click();
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");

    cy.EvaluateCurrentValue("select * from configs");
    cy.runAndDeleteQuery();
  });
  it("Deletes a datasource", () => {
    cy.NavigateToDatasourceEditor();
    cy.get(`.t--entity-name:contains(${datasourceName})`).click();

    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
