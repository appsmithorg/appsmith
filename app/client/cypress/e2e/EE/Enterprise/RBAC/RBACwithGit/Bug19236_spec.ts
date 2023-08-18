import {
  agHelper,
  adminSettings,
  dataSources,
  entityExplorer,
  gitSync,
  homePage,
  rbacHelper,
  draggableWidgets,
} from "../../../../../support/ee/ObjectsCore_EE";

describe("Validate RBAC with GIT bug #19236", function () {
  let workspaceName: any,
    appName: any,
    repoName: any,
    roleName: any,
    pageName: any;

  before(() => {
    rbacHelper.RoleIntercepts();
  });

  it("1. Bug:19236: In the git connect app user can't uncheck the permissions for the newly merged pages from the child branches.", function () {
    // Create an app
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = uid;
      appName = "Bug19236_" + uid;
      roleName = "Role_" + uid;
      pageName = "Page_" + uid;
      homePage.CreateNewWorkspace(workspaceName, true);
      homePage.CreateAppInWorkspace(workspaceName, appName);

      // Generate Postgres CRUD page in the App
      dataSources.GeneratePostgresCRUDPage("suppliers");

      // Connect the App to Git
      gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });

      // Create custom roles with create, edit, view permissions to the app
      adminSettings.NavigateToAdminSettings();
      rbacHelper.CreatePermissionAppLevel(roleName, workspaceName, appName);

      // Assign custom role to testuser1
      rbacHelper.AssignRoleToUser(roleName, Cypress.env("TESTUSERNAME1"));
      rbacHelper.AssignRoleToUser(
        "Instance Administrator Role",
        Cypress.env("TESTUSERNAME1"),
      );
      homePage.NavigateToHome();
      homePage.LogOutviaAPI();

      // Login as testuser1
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );

      // Open the app
      homePage.SearchAndOpenApp(appName);

      // Create new git branch
      gitSync.CreateGitBranch();

      // Add new page & widgets in the new branch
      entityExplorer.AddNewPage();
      entityExplorer.RenameEntityFromExplorer("Page2", pageName, true);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART, 300, 300);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 150, 150);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.LIST_V2, 300, 700);

      // Commit these changes to new branch
      gitSync.CommitAndPush();

      // Merge new branch to master
      gitSync.MergeToMaster();

      // Now, try to change the permission of newly merge page & validate permissions after save
      adminSettings.NavigateToAdminSettings();
      rbacHelper.ModifyPermissionsNSave(roleName, pageName, "Create", false);
      agHelper
        .GetElement(rbacHelper.checkbox(pageName, "Create"))
        .should("not.be.checked");
      // Unassigning create permission should automatically unassign edit & view permissions
      agHelper
        .GetElement(rbacHelper.checkbox(pageName, "Edit"))
        .should("not.be.checked");
      agHelper
        .GetElement(rbacHelper.checkbox(pageName, "View"))
        .should("not.be.checked");
    });
    homePage.LogOutviaAPI();
  });

  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
