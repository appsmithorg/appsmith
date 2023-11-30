import {
  adminSettings,
  agHelper,
  dataSources,
  entityExplorer,
  fakerHelper,
  homePage,
  locators,
  rbacHelper,
} from "../../../../../support/ee/ObjectsCore_EE";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

describe("User performing actions on page with access and without access Tests", function () {
  let workspaceName: string, appName: string, datasourceName;
  const pageName = "page_no_permission" + fakerHelper.GetRandomNumber();
  const permissionAtPageLevel =
    "PagePermissionRule" + fakerHelper.GetRandomNumber();
  const queryName = "GetProduct" + fakerHelper.GetRandomNumber();

  beforeEach(() => {
    rbacHelper.RoleIntercepts();
  });

  /**
   * Creates a workspace
   * In the workspace creates an app
   * Creates 2 pages in the page and renames Page 2 to page_no_permission
   * Creates a datasource - Postgres
   * Adds a query1 to the datasource
   * Runs and checks the query1
   * Creates a role with access to Page 1
   * Modifies the role to remove edit access to Page 2
   * Modifies the role to add view access to the Page 2
   * Modifies thr role to add only view permission to query1
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
      PageList.AddNewPage("New blank page")?.then((newPage) => {
        entityExplorer.RenameEntityFromExplorer(newPage, pageName, true);
      });
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
      });
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM public.astronauts LIMIT 10;",
        queryName,
      );
      dataSources.RunQuery();
      adminSettings.NavigateToAdminSettings();
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      rbacHelper.CreatePermissionPageLevel(
        permissionAtPageLevel,
        workspaceName,
        appName,
        "Page1",
      );
    });
    rbacHelper.ModifyPermissionsNSave(
      permissionAtPageLevel,
      pageName,
      "Edit",
      false,
    );
    rbacHelper.ModifyPermissionsNSave(
      permissionAtPageLevel,
      pageName,
      "View",
      true,
    );
    rbacHelper.ModifyPermissionsNSave(
      permissionAtPageLevel,
      queryName,
      "View",
      true,
    );
    rbacHelper.AssignRoleToUser(
      permissionAtPageLevel,
      Cypress.env("TESTUSERNAME1"),
    );
    adminSettings.NavigateToAdminSettings();
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
  });

  /**
   * Creates a role with edit acces to Page 1 and view access to Page 2
   * Assign the role to test user
   * Login as test user and verify the access to the pages
   * Verify copy is not present in
   */
  it("1.Verify Page edit permission for test user with view permission on page level", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    cy.wait(5000);
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(5000);
    homePage.SearchAndOpenApp(appName);
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragNDropWidget("checkboxwidget", 300, 100, "", "", true);
    agHelper.AssertElementAbsence(locators._saveStatusError);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    entityExplorer.DragNDropWidget("checkboxwidget", 300, 100, "", "", true);
    agHelper.AssertElementExist(locators._saveStatusError);
    EditorNavigation.SelectEntityByName(queryName, EntityType.Query);
    agHelper.GetNClick(entityExplorer._contextMenu(queryName), 0, true, 500);
    agHelper.AssertElementAbsence(locators._contextMenuItem("Copy to page"));
  });

  /**
   * User with 2 roles - Developer and custom with page view permission, Developer takes precedence
   * and user is able to edit the page
   */
  it("2. User with 2 roles - Dev and custom page view", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    adminSettings.NavigateToAdminSettings();
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
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
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    entityExplorer.DragDropWidgetNVerify("checkboxwidget");
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    entityExplorer.DragDropWidgetNVerify("checkboxwidget");
  });

  /**
   * user with edit role on page and no delete permission on page
   */
  it("3. Verify query edit permission for test user", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.wait(5000);
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(5000);
    adminSettings.NavigateToAdminSettings();
    rbacHelper.AssignRoleToUser(
      permissionAtPageLevel,
      Cypress.env("TESTUSERNAME2"),
    );
    rbacHelper.ModifyPermissionsNSave(
      permissionAtPageLevel,
      queryName,
      "Edit",
      true,
    );
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
      "App Viewer",
    );
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(5000);
    homePage.SearchAndOpenApp(appName);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    EditorNavigation.SelectEntityByName(queryName, EntityType.Query);
    agHelper.GetNClick(entityExplorer._contextMenu(queryName), 0, true, 500);
    agHelper.AssertElementExist(locators._contextMenuItem("Copy to page"));
    agHelper.AssertElementAbsence(locators._contextMenuItem("Delete"));
  });

  /**
   * user with delete permission on page
   */
  it("4. Verify query delete permission for test user", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    adminSettings.NavigateToAdminSettings();
    rbacHelper.AssignRoleToUser(
      permissionAtPageLevel,
      Cypress.env("TESTUSERNAME2"),
    );
    rbacHelper.ModifyPermissionsNSave(
      permissionAtPageLevel,
      queryName,
      "Delete",
      true,
    );
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
      "App Viewer",
    );
    homePage.SearchAndOpenApp(appName);
    EditorNavigation.SelectEntityByName(pageName, EntityType.Page);
    EditorNavigation.SelectEntityByName(queryName, EntityType.Query);
    agHelper.GetNClick(entityExplorer._contextMenu(queryName), 0, true, 500);
    agHelper.AssertElementExist(locators._contextMenuItem("Delete"));
  });

  after(() => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);

    agHelper.VisitNAssert("settings/roles", "fetchRoles");
    rbacHelper.DeleteRole(permissionAtPageLevel);
    homePage.NavigateToHome();
    homePage.DeleteApplication(appName);
    homePage.DeleteWorkspace(workspaceName);
  });
});
