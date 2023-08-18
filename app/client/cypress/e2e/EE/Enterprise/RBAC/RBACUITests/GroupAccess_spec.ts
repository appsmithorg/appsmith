import {
  homePage,
  agHelper,
  adminSettings,
  entityExplorer,
  locators,
  dataSources,
  rbacHelper,
  fakerHelper,
} from "../../../../../support/ee/ObjectsCore_EE";

describe("Create group, check if users in group has group roles accessess", function () {
  let workspaceName: string, appName: string, datasourceName;
  const pageName = "page_no_permission" + fakerHelper.GetRandomNumber();
  const permissionAtPageLevel =
    "PagePermissionRule" + fakerHelper.GetRandomNumber();
  const queryName = "GetProduct" + fakerHelper.GetRandomNumber();
  const groupName = "test-group" + fakerHelper.GetRandomNumber();

  beforeEach(() => {
    rbacHelper.RoleIntercepts();
  });

  /**
   * Creates a workspace
   * In the workspace creates an app
   * Creates 2 pages in the page and renames Page 2 to page_no_permission
   * Creates a datasource - Postgres
   * Adds a query to the datasource
   * Runs and checks the query
   * Creates a role with access to Page 1
   * Modifies the role to remove edit access to Page 2
   * Modifies the role to add view access to the Page 2
   * Create a Group
   * Adds the test user 1 to the group
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
      entityExplorer.AddNewPage("New blank page")?.then((newPage) => {
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
    rbacHelper.CreateGroup(groupName);
    rbacHelper.AddUserToGroup(groupName, Cypress.env("TESTUSERNAME1"));
    rbacHelper.AddRoleToGroup(groupName, permissionAtPageLevel);
  });
  /**
   * Verify if the user has no edit permission to Page 2 - page_no_permission
   */
  it("1.Verify edit permission for a page to a group ", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    homePage.SearchAndOpenApp(appName);
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.DragNDropWidget("checkboxwidget");
    agHelper.AssertElementAbsence(locators._saveStatusError);
    entityExplorer.SelectEntityByName(pageName, "Pages");
    entityExplorer.DragNDropWidget("checkboxwidget");
    agHelper.AssertElementExist(locators._saveStatusError);
    entityExplorer.SelectEntityByName(queryName, "Queries/JS");
    agHelper.GetNClick(entityExplorer._contextMenu(queryName), 0, true, 500);
    agHelper.AssertElementAbsence(locators._contextMenuItem("Copy to page"));
  });

  /**
   * On seetting the Developer role, verify if the user has edit permission to Page 2
   */
  it("2. group with 2 roles - Dev and custom page view", function () {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    rbacHelper.AddDefaultRoleGroup(groupName, "Developer", workspaceName);
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Developer",
    );
    homePage.SearchAndOpenApp(appName);
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.DragDropWidgetNVerify("checkboxwidget");
    entityExplorer.SelectEntityByName(pageName, "Pages");
    entityExplorer.DragDropWidgetNVerify("checkboxwidget");
  });
});
