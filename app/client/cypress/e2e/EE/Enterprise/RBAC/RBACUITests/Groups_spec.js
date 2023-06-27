const RBAC = require("../../../../../locators/RBAClocators.json");
import {
  adminSettings,
  agHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe("Groups tab Tests", function () {
  let groups;
  before(() => {
    cy.AddIntercepts();
    adminSettings.NavigateToAdminSettings();
  });

  it("1. Verify functionality of groups tab ", function () {
    groups = "Tech";
    agHelper.AssertElementVisible(RBAC.groupsTab);
    cy.createGroupAndAddUser(
      groups,
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTUSERNAME2"),
    );
    cy.get(RBAC.rolesTabinGroup).click();
    cy.get(RBAC.removePermissionGroup).should("not.exist");
    cy.get("[data-testid='default-roles-toggle']").click();
    cy.get(RBAC.addPermissionGroup).first().click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@assignRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(RBAC.removePermissionGroup).should("exist");
    cy.get(RBAC.searchBar).type(groups);
  });
});
