const RBAC = require("../../../../../locators/RBAClocators.json");
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import { rbacHelper, agHelper } from "../../../../../support/ee/ObjectsCore_EE";
describe("users tab Tests", { tags: ["@tag.AccessControl"] }, function () {
  const GroupName = "Invite User Group" + `${Math.floor(Math.random() * 1000)}`;
  const RoleName = "Invite User Role" + `${Math.floor(Math.random() * 1000)}`;
  beforeEach(() => {
    cy.AddIntercepts();
  });
  before(() => {
    cy.AddIntercepts();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/general");
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    cy.CreateRole(RoleName);
    cy.CreateGroup(GroupName);
  });

  it("1.Verify functionality of Users tab", function () {
    agHelper.VisitNAssert("/settings/general");
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    agHelper.AssertElementVisibility(RBAC.usersTab);
    agHelper.GetNClick(RBAC.usersTab);
    cy.get(RBAC.searchBar).clear().type(Cypress.env("USERNAME"));
    cy.wait(2000);
    cy.get("[data-testid=acl-user-listing-link]").first().click();
  });

  it("2.Verify functionality of Users tab - Invite user via Roles", function () {
    cy.visit("/settings/general");
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    cy.get(RBAC.usersTab).click();
    cy.AssignRoleToUser(RoleName, Cypress.env("TESTUSERNAME1"));
    cy.get(RBAC.usersTab).click();
    agHelper.TypeText(RBAC.searchBar, Cypress.env("TESTUSERNAME1"));
    agHelper.GetNClick(
      rbacHelper.textToClick(Cypress.env("TESTUSERNAME1")),
      0,
      true,
    );
    // cy.get("[data-testid=acl-user-listing-link]").first().click();
    cy.get("[data-testid=t--tab-roles]").click();
    agHelper.AssertContains(RoleName);
    // cy.get("[data-testid=t--active-groups]").contains(RoleName);
  });

  it("3.Verify functionality of Users tab - Invite user via Groups", function () {
    cy.visit("/settings/general");
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    cy.get(RBAC.usersTab).click();
    cy.AssignGroupToUser(GroupName, Cypress.env("TESTUSERNAME2"));
    agHelper.TypeText(RBAC.searchBar, Cypress.env("TESTUSERNAME2"));
    agHelper.GetNClick(
      rbacHelper.textToClick(Cypress.env("TESTUSERNAME2")),
      0,
      true,
    );
    cy.get("[data-testid=t--tab-groups]").click();
    agHelper.AssertContains(GroupName);
    // cy.get("[data-testid=t--active-groups]").contains(GroupName);
  });
});
