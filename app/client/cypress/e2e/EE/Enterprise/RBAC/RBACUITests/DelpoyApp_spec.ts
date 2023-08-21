import {
  homePage,
  agHelper,
  adminSettings,
  entityExplorer,
  fakerHelper,
  deployMode,
  rbacHelper,
  locators,
} from "../../../../../support/ee/ObjectsCore_EE";

import homepagelocators from "../../../../../locators/HomePage";

describe("User deploying an app with and without edit permission for a page", function () {
  let workspaceName: string, appName: string;
  const pageName = "page_no_permission" + fakerHelper.GetRandomNumber();
  const permissionAtPageLevel =
    "PagePermissionRule" + fakerHelper.GetRandomNumber();

  beforeEach(() => {
    rbacHelper.RoleIntercepts();
  });

  /**
   * Creates a workspace
   * In the workspace creates an app
   * Creates 2 pages in the page and renames Page 2 to page_no_permission
   * Creates a role with access to Page 1
   * Modifies the role to remove edit access to Page 2
   * Assigns the role to the test user 1
   */
  before(() => {
    rbacHelper.RoleIntercepts();
    agHelper.GenerateUUID();
    // get the guid from the alias and assign it to the workspace name
    cy.get("@guid").then((guid) => {
      workspaceName = "workspace" + guid;
      appName = "app" + guid;
      homePage.CreateNewWorkspace(workspaceName, true);
      homePage.CreateAppInWorkspace(workspaceName, appName);
      entityExplorer.AddNewPage("New blank page").then((newPage) => {
        entityExplorer.RenameEntityFromExplorer(newPage, pageName, true);
      });
      adminSettings.NavigateToAdminSettings();
      rbacHelper.CreatePermissionPageLevel(
        permissionAtPageLevel,
        workspaceName,
        appName,
        "Page1",
      );
    });
    rbacHelper.ModifyPermissions(
      permissionAtPageLevel,
      pageName,
      "Edit",
      false,
    );
    rbacHelper.AssignRoleToUser(
      permissionAtPageLevel,
      Cypress.env("TESTUSERNAME1"),
    );
  });

  /**
   * Creates a role with edit acces to Page 1 and view access to Page 2 and export permission
   * Assign the role to test user
   * Login as test user and deploys the app
   * Asserts the error message
   */
  it("1.Verify deploy app, user shouldn't be able to deploy", function () {
    adminSettings.NavigateToAdminSettings();
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    homePage.SearchAndOpenApp(appName);
    agHelper.ClickButton("Deploy");
    agHelper.GetText(locators._toastMsg).then((text) => {
      expect(text).to.contain(
        "Unable to deploy the Application. " +
          "You don't have required permissions for page: ",
      );
    });
  });

  /**
   * User with 2 roles - Developer and custom with page view permission, Developer takes precedence
   * User logs in and deploys the app
   * Assert user is able to deploy
   */
  it("2. User with 2 roles - Dev and export, user should be able to deploy", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    adminSettings.NavigateToAdminSettings();
    rbacHelper.AddDefaultRole(
      Cypress.env("TESTUSERNAME1"),
      "Developer",
      workspaceName,
    );
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Developer",
    );
    homePage.SearchAndOpenApp(appName);
    deployMode.DeployApp();
  });

  /**
   * Assign export permsission to the role
   * Login as test user and export the app
   * User should be able to export the app, Verify the success message
   */
  it("3. Test user with export permission is able to export the app", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    adminSettings.NavigateToAdminSettings();
    rbacHelper.ModifyPermissions(
      permissionAtPageLevel,
      appName,
      "Export",
      true,
    );
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Developer",
    );
    homePage.FilterApplication(appName);
    agHelper.GetNClick(homepagelocators.appMoreIcon);
    agHelper.GetNClick(homepagelocators.exportAppFromMenu);
    agHelper.AssertContains("Successfully exported");
  });
});
