const RBAC = require("../../../../../locators/RBAClocators.json");

describe("users tab Tests", function() {
  const GroupName = "Invite User Group" + `${Math.floor(Math.random() * 1000)}`;
  const RoleName = "Invite User Role" + `${Math.floor(Math.random() * 1000)}`;
  beforeEach(() => {
    cy.AddIntercepts();
  });
  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/general");
    cy.CreateRole(RoleName);
    cy.CreateGroup(GroupName);
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
    cy.AssignRoleToUser(RoleName, Cypress.env("TESTUSERNAME1"));
    cy.get(RBAC.usersTab).click();
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("TESTUSERNAME1"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
    cy.get("[data-cy=t--tab-roles]").click();
    cy.get("[data-testid=t--active-groups]").contains(RoleName);
  });

  it("3.Verify functionality of Users tab - Invite user via Groups", function() {
    cy.visit("/settings/general");
    cy.get(RBAC.usersTab).click();
    cy.AssignGroupToUser(GroupName, Cypress.env("TESTUSERNAME2"));
    cy.get(RBAC.searchBar)
      .clear()
      .type(Cypress.env("TESTUSERNAME2"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]")
      .first()
      .click();
    cy.get("[data-cy=t--tab-groups]").click();
    cy.get("[data-testid=t--active-groups]").contains(GroupName);
  });
});
