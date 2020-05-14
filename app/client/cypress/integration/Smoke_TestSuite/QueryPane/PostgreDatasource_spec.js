const queryLocators = require("../../../locators/QueryEditor.json");

describe("Create a query with a postgres datasource, run, save and then delete the query", function() {
  it("Create a query with a postgres datasource, run, save and then delete the query", function() {
    cy.NavigateToDatasourceEditor();
    cy.get("@getPlugins").then(httpResponse => {
      const pluginName = httpResponse.response.body.data.find(
        plugin => plugin.packageName === "postgres-plugin",
      ).name;

      cy.get(".t--plugin-name")
        .contains(pluginName)
        .click();
    });

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

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
      .type("select * from users");

    cy.runSaveDeleteQuery();

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
