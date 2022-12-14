const RBAC = require("../../../../../locators/RBAClocators.json");

describe("users tab Tests", function() {
  beforeEach(() => {
    cy.AddIntercepts();
  });
  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/general");
    cy.CreateRole("Invite User Role");
    cy.CreateGroup("Invite User Group");
  });

  it("1.Verify functionality of Users tab", function() {
    cy.visit("/settings/general");
    cy.get(RBAC.usersTab).click();
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("USERNAME"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
  });

  it("2.Verify functionality of Users tab - Invite user via Roles", function() {
    cy.visit("/settings/general");
    cy.get(RBAC.usersTab).click();
    cy.AssignRoleToUser("Invite User Role", Cypress.env("TESTUSERNAME1"));
    cy.get(RBAC.usersTab).click();
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("TESTUSERNAME1"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
    cy.get("[data-cy=t--tab-roles]").click();
    cy.get("[data-testid=t--active-groups]").contains("Invite User Role");
  });

  it("3.Verify functionality of Users tab - Invite user via Groups", function() {
    cy.visit("/settings/general");
    cy.get(RBAC.usersTab).click();
    cy.AssignGroupToUser("Invite User Group", Cypress.env("TESTUSERNAME2"));
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("TESTUSERNAME2"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
    cy.get("[data-cy=t--tab-groups]").click();
    cy.get("[data-testid=t--active-groups]").contains("Invite User Group");
  });
});
