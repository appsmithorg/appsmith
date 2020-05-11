describe("Create, test, save then delete a mongo datasource", function() {
  it("Create, test, save then delete a mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get("@getPlugins").then(httpResponse => {
      const pluginName = httpResponse.response.body.data.find(
        plugin => plugin.packageName === "mongo-plugin",
      ).name;

      cy.get(".t--plugin-name")
        .contains(pluginName)
        .click();
    });

    cy.getPluginFormsAndCreateDatasource();

    cy.fillMongoDatasourceForm();

    cy.testSaveDeleteDatasource();
  });
});
