const RBAC = require("../../../../../locators/RBAClocators.json");

describe("users tab Tests", function() {
  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("settings/general");
  });

  it("1.Verify functionality of Users tab", function() {
    cy.get(RBAC.usersTab).click();
    cy.wait("@fetchUsers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("TESTUSERNAME1"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
  });
});
