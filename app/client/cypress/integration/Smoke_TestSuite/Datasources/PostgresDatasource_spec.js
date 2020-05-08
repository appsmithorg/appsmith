describe("Create, test, save then delete a postgres datasource", function() {
  it("Create, test, save then delete a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get("@getPlugins").then(httpResponse => {
      // console.log(response, "response");
      const pluginName = httpResponse.response.body.data.find(
        plugin => plugin.packageName === "postgres-plugin",
      ).name;

      cy.get(".t--plugin-name")
        .contains(pluginName)
        .click();
    });

    cy.getPluginFormsAndCreateDatasource();

    cy.get(`input[name="datasourceConfiguration.endpoints[0].host"]`).type(
      "appsmith-test-db.cgg2px8dsrli.ap-south-1.rds.amazonaws.com",
    );
    cy.get(`input[name="datasourceConfiguration.endpoints[0].port"]`).type(
      5432,
    );
    cy.get(`input[name="datasourceConfiguration.authentication.databaseName"]`)
      .clear()
      .type("postgres");
    cy.get(
      `input[name="datasourceConfiguration.authentication.username"]`,
    ).type("postgres");
    cy.get(
      `input[name="datasourceConfiguration.authentication.password"]`,
    ).type("qwerty1234");

    cy.testSaveDeleteDatasource();
  });
});
