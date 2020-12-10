describe("Datasource form related tests", function() {
  it("Check whether the delete button has the right color", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("Testapi");
    cy.enterDatasourceAndPath("https://reqres.in/api/", "users");

    cy.get(".t--store-as-datasource-menu").click();
    cy.get(".t--store-as-datasource").click();

    cy.get(".t--form-control-KEY_VAL_INPUT .t--add-field").click();
    cy.get(".t--form-control-KEY_VAL_INPUT .t--delete-field").should(
      "attr",
      "color",
      "#A3B3BF",
    );
  });
  it("Check if save button is disabled", function() {
    cy.testDatasource();
    cy.get(".t--save-datasource").should("not.be.disabled");
  });

  // wip
  it("Check if saved api as a datasource does not fail on cloning", function() {
    cy.NavigateToAPI_Panel();
    cy.get('.t--entity-name:contains("Testapi")')
      .first({ force: true })
      .click();

    cy.get('.t--entity-name:contains("Testapi")')
      .parent()
      .trigger("mouseover")
      .find(".entity-context-menu")
      .click({ force: true });
  });
});
