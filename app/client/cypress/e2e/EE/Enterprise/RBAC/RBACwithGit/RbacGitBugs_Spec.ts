import template from "../../../../../locators/TemplatesLocators.json";
import RBAC from "../../../../../locators/RBAClocators.json";
import {
  agHelper,
  adminSettings,
  assertHelper,
  dataManager,
  dataSources,
  entityExplorer,
  gitSync,
  homePage,
  rbacHelper,
  draggableWidgets,
  apiPage,
} from "../../../../../support/ee/ObjectsCore_EE";

describe(
  "excludeForAirgap",
  "Validates RBAC with GIT bugs - 19151, 19148, 19143",
  function () {
    let workspaceName: any,
      appName: any,
      repoName: any,
      roleName: any,
      pageId: any;
    beforeEach(() => {
      rbacHelper.RoleIntercepts();
    });

    it("1. Bug:19151: Not able to create new branch, when user is assigned a custom role.", function () {
      // Create an app
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = uid;
        appName = "Bug19151_" + uid;
        roleName = "Role_" + uid;
        pageId = uid;
        homePage.CreateNewWorkspace(workspaceName, true);
        homePage.CreateAppInWorkspace(workspaceName, appName);

        // Generate Postgres CRUD page in the App
        dataSources.GeneratePostgresCRUDPage("suppliers");
        entityExplorer.RenameEntityFromExplorer("Page1", "Crud_page", true);

        // Add marketing dashboard template
        entityExplorer.AddNewPage("Add page from template");
        agHelper.AssertElementVisibility(template.templateDialogBox);
        agHelper.GetNClick(template.marketingDashboard);
        agHelper.Sleep(5000); // for templates page to load fully
        agHelper.GetNClick(template.templateViewForkButton);
        agHelper.ValidateToastMessage("template added successfully");

        // Add application tracker template
        entityExplorer.AddNewPage("Add page from template");
        agHelper.AssertElementVisibility(template.templateDialogBox);
        agHelper.GetNClick(template.applicationTrackerDashboard);
        agHelper.Sleep(5000); // for templates page to load fully
        agHelper.GetNClick(template.templateViewForkButton);
        agHelper.ValidateToastMessage("template added successfully");

        // Rename required pages to make searching for the pages easier when there are 2 or more pages with similar name
        entityExplorer.RenameEntityFromExplorer(
          "Customer Data",
          "Customer_Data_" + uid,
          false,
        );
        entityExplorer.RenameEntityFromExplorer(
          "2 Application Upload",
          "Application_Upload_" + uid,
          false,
        );

        // Connect the App to Git
        gitSync.CreateNConnectToGit();
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;
        });

        // Create custom roles with create, edit, view permissions to all the pages in the app except customer data & application upload pages
        adminSettings.NavigateToAdminSettings();
        rbacHelper.CreatePermissionAppLevel(roleName, workspaceName, appName);
        rbacHelper.ModifyPermissionsNSave(
          roleName,
          "Customer_Data_" + uid,
          "Create",
          false,
        );
        rbacHelper.ModifyPermissionsNSave(
          roleName,
          "Application_Upload_" + uid,
          "Create",
          false,
        );

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

        // Validate if we are able to create new git branch
        gitSync.CreateGitBranch();
      });
    });

    it("2. Bug:19148: The commit and push Gets struck when the user tries to commit and push new changes.", function () {
      // Add new page, widgets, api in the new branch
      entityExplorer.AddNewPage();
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART, 300, 300);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 150, 150);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.LIST_V2, 300, 700);
      entityExplorer.NavigateToSwitcher("Explorer");
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      entityExplorer.SelectEntityByName("Button1", "Widgets");

      // Validate if we are able to commit these changes to new branch
      gitSync.CommitAndPush();
      agHelper.GetNClick(gitSync._bottomBarCommit);
      agHelper.AssertElementVisibility(gitSync._gitSyncModal);
      agHelper.AssertElementAbsence(gitSync._gitStatusChanges);
      gitSync.CloseGitSyncModal();
    });

    it("3. Bug:19143: Pages without access should not show up on switching to master branch", function () {
      // Switch to master branch & refresh the page
      gitSync.SwitchGitBranch("master");
      agHelper.RefreshPage();

      // Validate that the pages without access are not showing up & the pages which have access are showing up
      agHelper.AssertElementAbsence(
        entityExplorer._entityNameInExplorer("Customer_Data_" + pageId),
      );
      agHelper.AssertElementAbsence(
        entityExplorer._entityNameInExplorer("Application_Upload_" + pageId),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("1 Track Applications"),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("Send Messages"),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("Crud_page"),
      );

      //Git sync modal should not show any changes
      agHelper.AssertElementVisibility(gitSync._bottomBarCommit);
      agHelper.AssertElementAbsence(gitSync._gitPullCount);
      agHelper.GetNClick(gitSync._bottomBarCommit);
      agHelper.AssertElementVisibility(gitSync._gitSyncModal);
      agHelper.GetNAssertContains(
        gitSync._commitCommentInput,
        "No changes to commit",
      );

      // Refresh page & recheck above validation
      agHelper.RefreshPage();

      agHelper.AssertElementAbsence(
        entityExplorer._entityNameInExplorer("Customer_Data_" + pageId),
      );
      agHelper.AssertElementAbsence(
        entityExplorer._entityNameInExplorer("Application_Upload_" + pageId),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("1 Track Applications"),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("Send Messages"),
      );
      agHelper.AssertElementVisibility(
        entityExplorer._entityNameInExplorer("Crud_page"),
      );

      //Validate if roles are unchecked for customer data & application tracker pages (Pages without access)
      adminSettings.NavigateToAdminSettings();
      agHelper.GetNClick(RBAC.rolesTab);
      assertHelper.AssertNetworkStatus("@fetchRoles", 200);
      agHelper.ClearTextField(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, roleName);
      agHelper.GetNClick(rbacHelper.textToClick(roleName), 0, true);
      agHelper.ClearTextField(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, "Customer_Data_" + pageId);
      agHelper
        .GetElement(rbacHelper.checkbox("Customer_Data_" + pageId, "Create"))
        .should("not.be.checked");

      agHelper.ClearTextField(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, "Application_Upload_" + pageId);
      agHelper
        .GetElement(
          rbacHelper.checkbox("Application_Upload_" + pageId, "Create"),
        )
        .should("not.be.checked");
    });

    after(() => {
      //clean up
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
