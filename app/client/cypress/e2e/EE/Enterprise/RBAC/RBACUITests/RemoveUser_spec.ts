import {
  homePage,
  agHelper,
  adminSettings,
  rbacHelper,
  fakerHelper,
} from "../../../../../support/ee/ObjectsCore_EE";
import rbac from "../../../../../locators/RBAClocators.json";

import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";

describe(
  "tests for user with remove user permission",
  { tags: ["@tag.AccessControl"] },
  function () {
    const groupName1 = "test-group" + fakerHelper.GetRandomNumber();
    const groupName2 = "test-group" + fakerHelper.GetRandomNumber();
    const roleName = "test-role" + fakerHelper.GetRandomNumber();

    beforeEach(() => {
      rbacHelper.RoleIntercepts();
    });

    /**
     * creates 2 groups
     * Adds test user 1 to group 1
     * Adds test user 2 to group 1
     * Creates a role
     * Gives remove user permission to the  group1
     * Adds the role to group 1
     */
    before(() => {
      rbacHelper.RoleIntercepts();
      adminSettings.NavigateToAdminSettings();
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      rbacHelper.CreateGroup(groupName2);
      rbacHelper.CreateGroup(groupName1);
      rbacHelper.AddUserToGroup(groupName1, Cypress.env("TESTUSERNAME1"));
      rbacHelper.AddUserToGroup(groupName1, Cypress.env("TESTUSERNAME2"));
      rbacHelper.CreateRole(roleName);
      rbacHelper.GroupsAndRolesTabInUsersPage(groupName1, "Remove User");
      rbacHelper.GotoGroups(groupName1);
      rbacHelper.AddRoleToGroup(groupName1, roleName);
    });

    it("1. Log in as test user 1 and check if the user is able to remove test user2", function () {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      agHelper.GetNClick(adminSettings._adminSettingsBtn);
      agHelper.AssertElementAbsence(rbac.usersTab);
      agHelper.AssertElementAbsence(rbacHelper.textToClick(groupName2));
      agHelper.GetNClick(rbac.rolesTab);
      rbacHelper.GotoGroups(groupName1);
      agHelper.TypeText(rbac.searchBar, Cypress.env("TESTUSERNAME2"));
      agHelper.PressEnter();
      agHelper.GetNClick(
        rbacHelper.textToClick(Cypress.env("TESTUSERNAME2")),
        0,
        true,
      );
      agHelper.GetNClick(rbac.userContextMenu, 0, true, 0);
      agHelper.GetNClick(rbacHelper.deleteMenu);
      agHelper.GetNClick(rbac.deleteConfirmation);
      agHelper.AssertElementAbsence(
        rbacHelper.textToClick(Cypress.env("TESTUSERNAME2")),
      );
    });
  },
);
