import {
  homePage,
  agHelper,
  adminSettings,
  rbacHelper,
  assertHelper,
} from "../../../../../support/ee/ObjectsCore_EE";

import rbac from "../../../../../locators/RBAClocators.json";

describe("rbac miscellaneous cases ", function () {
  const instanceAdminRole = "Instance Administrator Role";

  beforeEach(() => {
    rbacHelper.RoleIntercepts();
  });

  /**
   * Assign instanace admin role to test user
   * Login as test user
   * Remove instance admin role from test user
   * Refresh the page and check if admin settings button is not visible in left pane
   */
  it(
    "1. Assigns test user, instance admin role and tests if the user is able to remove themselves as" +
      "instance admin successfull",
    function () {
      adminSettings.NavigateToAdminSettings();
      rbacHelper.AddDefaultRole(
        Cypress.env("TESTUSERNAME1"),
        instanceAdminRole,
      );
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      adminSettings.NavigateToAdminSettings();
      rbacHelper.RemoveRole(Cypress.env("TESTUSERNAME1"), instanceAdminRole);
      agHelper.AssertElementAbsence(adminSettings._adminSettingsBtn);
    },
  );

  it("2. Verify clear button is working as expected", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    adminSettings.NavigateToAdminSettings();
    agHelper.GetNClick(rbac.usersTab);
    assertHelper.AssertNetworkStatus("@fetchUsers", 200);
    agHelper.TypeText(rbac.searchBar, Cypress.env("TESTUSERNAME1"));
    agHelper.GetNClick(rbacHelper.userRow(Cypress.env("TESTUSERNAME1")));
    agHelper.WaitUntilEleAppear(rbacHelper.rolesTab);
    agHelper.GetNClick(rbacHelper.rolesTab);
    agHelper.GetNClick(rbacHelper.defaultRoleToggle);
    agHelper.GetNClick(rbacHelper.rolesRow(instanceAdminRole));
    agHelper.AssertElementVisibility(rbac.saveButton);
    agHelper.AssertElementVisibility(rbac.clearButton);
    agHelper.GetNClick(rbac.clearButton);
    agHelper.AssertElementAbsence(rbac.saveButton);
    agHelper.AssertElementAbsence(rbac.clearButton);
  });

  it("3. Default Role for All users in not removable", function () {
    adminSettings.NavigateToAdminSettings();
    agHelper.GetNClick(rbac.usersTab);
    assertHelper.AssertNetworkStatus("@fetchUsers", 200);
    agHelper.TypeText(rbac.searchBar, Cypress.env("TESTUSERNAME1"));
    agHelper.GetNClick(rbacHelper.userRow(Cypress.env("TESTUSERNAME1")));
    agHelper.WaitUntilEleAppear(rbacHelper.rolesTab);
    agHelper.GetNClick(rbacHelper.rolesTab);
    agHelper.HoverElement(rbacHelper.rolesRow("Default Role For All Users"));
    agHelper.AssertTooltip("You do not have permission to unassign this role.");
    agHelper.AssertElementClassContainsDisabled(
      rbacHelper.rolesRow("Default Role For All Users") + "/ancestor::div",
    );
  });
});
