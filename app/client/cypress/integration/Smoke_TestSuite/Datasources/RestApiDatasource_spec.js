describe("Create, test, save then delete a restapi datasource", function() {
  it("Create, test, save then delete a restapi datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get("@getPlugins").then(httpResponse => {
      // console.log(response, "response");
      const pluginName = httpResponse.response.body.data.find(
        plugin => plugin.packageName === "restapi-plugin",
      ).name;

      cy.get(".t--plugin-name")
        .contains(pluginName)
        .click();
    });

    cy.getPluginFormsAndCreateDatasource();

    cy.get(`input[name="datasourceConfiguration.url"]`).type(
      "https://my-json-server.typicode.com/typicode/demo/posts",
    );

    cy.testSaveDeleteDatasource();
  });
});
