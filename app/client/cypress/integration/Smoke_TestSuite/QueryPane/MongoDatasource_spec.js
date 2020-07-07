const queryLocators = require("../../../locators/QueryEditor.json");
const plugins = require("../../../fixtures/plugins.json");
const datasource = require("../../../locators/DatasourcesEditor.json");

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
  it("Create a query with a mongo datasource, run, save and then delete the query", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillMongoDatasourceForm();

    cy.testSaveDatasource();

    cy.NavigateToQueryEditor();

    cy.get("@createDatasource").then(httpResponse => {
      const datasourceName = httpResponse.response.body.data.name;

      cy.get(".t--datasource-name")
        .contains(datasourceName)
        .click();
    });

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`{"find": "planets"}`, { parseSpecialCharSequences: false });

    cy.runAndDeleteQuery();

    cy.NavigateToDatasourceEditor();
    cy.get("@createDatasource").then(httpResponse => {
      const datasourceId = httpResponse.response.body.data.id;

      cy.get(`[data-cy=${datasourceId}]`).click();
    });
    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
