describe("Create, test, save then delete a mongo datasource", function() {
  it("Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get("@getPlugins").then(httpResponse => {
      // console.log(response, "response");
      const pluginName = httpResponse.response.body.data.find(
        plugin => plugin.packageName === "mongo-plugin",
      ).name;

      cy.get(".t--plugin-name")
        .contains(pluginName)
        .click();
    });

    cy.getPluginFormsAndCreateDatasource();

    cy.get(`input[name="datasourceConfiguration.endpoints[0].host"]`).type(
      "ds119422.mlab.com",
    );
    cy.get(`input[name="datasourceConfiguration.endpoints[0].port"]`).type(
      19422,
    );
    cy.get(`input[name="datasourceConfiguration.authentication.databaseName"]`)
      .clear()
      .type("heroku_bcmprc4k");
    cy.get(
      `input[name="datasourceConfiguration.authentication.username"]`,
    ).type("akash");
    cy.get(
      `input[name="datasourceConfiguration.authentication.password"]`,
    ).type("123wheel");

    cy.get(
      "[data-cy=datasourceConfiguration\\.authentication\\.authType]",
    ).click();
    cy.contains("SCRAM-SHA-256").click({
      force: true,
    });

    cy.get(
      "[data-cy=datasourceConfiguration\\.connection\\.ssl\\.authType]",
    ).click();
    cy.contains("No SSL").click({
      force: true,
    });

    cy.testSaveDeleteDatasource();
  });
});
