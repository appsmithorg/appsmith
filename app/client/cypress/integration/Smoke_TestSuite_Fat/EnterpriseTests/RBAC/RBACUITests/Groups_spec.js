import homePage from "../../../../../locators/HomePage";
const RBAC = require("../../../../../locators/RBAClocators.json");

describe("Groups tab Tests", function() {
  let groups;
  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("settings/general");
  });
  it("1. Verify functionality of groups tab ", function() {
    groups = "Tech";
    cy.createGroupAndAddUser(
      groups,
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTUSERNAME2"),
    );
    cy.get(RBAC.rolesTabinGroup).click();
    cy.get(RBAC.rolesinGroups)
      .first()
      .click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.searchBar).type(groups);
  });
});
