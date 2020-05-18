describe("Create, test, save then delete a postgres datasource", function() {
  it("Create, test, save then delete a postgres datasource", function() {
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

    cy.testSaveDeleteDatasource();
  });
});
