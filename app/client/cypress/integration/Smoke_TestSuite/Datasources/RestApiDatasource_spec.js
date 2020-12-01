describe("Create a rest datasource", function() {
  it("Create a rest datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("Testapi");
    cy.enterDatasourceAndPath("https://reqres.in/api/", "users");

    cy.get(".t--store-as-datasource-menu").click();
    cy.get(".t--store-as-datasource").click();

    cy.saveDatasource();
    cy.contains(".datasource-highlight", "https://reqres.in");

    cy.SaveAndRunAPI();
  });
});
