import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

let repoName: any;
let tempBranch: any;
let statusBranch: any;
let tempBranch1: any;
let tempBranch2: any;
let tempBranch3: any;

describe("Git Bugs", function () {
  before(() => {
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("GitBugs" + uid, true);
      _.homePage.CreateAppInWorkspace("GitBugs" + uid);
    });
  });

  it("1. Bug 16248, When GitSync modal is open, block shortcut action execution", function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    _.apiPage.CreateAndFillApi(
      _.dataManager.dsValues[_.dataManager.defaultEnviorment].mockApiUrl,
      "GitSyncTest",
    );
    _.gitSync.OpenGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    cy.get("@postExecute").should("not.exist");
    _.gitSync.CloseGitSyncModal();
    cy.get("body").type(`{${modifierKey}}{enter}`);
    _.assertHelper.AssertNetworkStatus("@postExecute");
  });

  it("2. Bug 18665 : Creates a new Git branch, Create datasource, discard it and check current branch", function () {
    _.gitSync.CreateNConnectToGit();
    _.gitSync.CreateGitBranch(tempBranch, false);

    cy.get("@gitbranchName").then((branchName) => {
      tempBranch = branchName;
      _.dataSources.NavigateToDSCreateNew();
      _.dataSources.CreatePlugIn("PostgreSQL");
      _.dataSources.FillPostgresDSForm();
      _.dataSources.SaveDSFromDialog(false);
      _.agHelper.AssertElementVisibility(_.gitSync._branchButton);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });
  });

  it("3. Bug 18376:  navigateTo fails to set queryParams if the app is connected to Git", () => {
    _.entityExplorer.AddNewPage();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT);
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('Page2', {testQP: 'Yes'}, 'SAME_WINDOW')}}",
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.Sleep(500);
    EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
    EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{appsmith.URL.queryParams.testQP}}",
    );
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    _.agHelper.ClickButton("Submit");
    _.agHelper.Sleep(500);
    _.agHelper
      .GetText(_.locators._textWidget)
      .then(($qp) => expect($qp).to.eq("Yes"));
    _.agHelper.AssertURL("branch=" + tempBranch); //Validate we are still in Git branch
    _.agHelper.AssertURL("testQP=Yes"); //Validate we also ve the Query Params from Page1
  });

  it("4. Bug 24045 : Theme and app settings message in git status", function () {
    _.gitSync.SwitchGitBranch("master");
    _.gitSync.CreateGitBranch(`st`, true);
    cy.get("@gitbranchName").then((branchName) => {
      statusBranch = branchName;
      AppSidebar.navigate(AppSidebarButton.Settings);
      _.agHelper.GetNClick(_.locators._appThemeSettings);
      _.agHelper.GetNClick(_.locators._appChangeThemeBtn, 0, true);
      _.agHelper.GetNClick(_.locators._appThemeCard, 2);
      AppSidebar.navigate(AppSidebarButton.Pages);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.gitSync._gitStatusChanges);
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").CHANGES_THEME(),
        "exist",
        _.gitSync._gitStatusChanges,
      );
      _.agHelper.GetNClick(_.locators._dialogCloseButton);
      AppSidebar.navigate(AppSidebarButton.Settings);
      _.agHelper.GetNClick(_.locators._appNavigationSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettingsShowTitle);
      AppSidebar.navigate(AppSidebarButton.Pages);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.gitSync._gitStatusChanges);
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").CHANGES_APP_SETTINGS(),
        "exist",
        _.gitSync._gitStatusChanges,
      );
      _.agHelper.GetNClick(_.locators._dialogCloseButton);
    });
  });

  it("5. Bug 24946 : Discard message is missing when only navigation settings are changed", function () {
    _.gitSync.SwitchGitBranch("master");
    _.gitSync.CreateGitBranch(`b24946`, true);
    cy.get("@gitbranchName").then((branchName) => {
      statusBranch = branchName;
      AppSidebar.navigate(AppSidebarButton.Settings);
      _.agHelper.GetNClick(_.locators._appNavigationSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettingsShowTitle);
      AppSidebar.navigate(AppSidebarButton.Pages);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.gitSync._gitStatusChanges);
      _.agHelper.GetNClick(_.gitSync._discardChanges);
      _.agHelper.WaitUntilEleAppear(_.gitSync._discardCallout);
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING(),
        "exist",
        _.gitSync._discardCallout,
      );
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").DISCARD_MESSAGE(),
        "exist",
        _.gitSync._discardCallout,
      );
      _.agHelper.GetNClick(_.locators._dialogCloseButton);
    });
  });

  it("6. Bug 24486 : Loading state for remote branches", function () {
    _.gitSync.CreateRemoteBranch(repoName, "test-24486");
    _.gitSync.SwitchGitBranch("origin/test-24486", false, true);
  });

  it("7. Bug 24920: Not able to discard app settings changes for the first time in git connected app ", function () {
    _.gitSync.SwitchGitBranch("master", false, true);
    // add navigation settings changes
    AppSidebar.navigate(AppSidebarButton.Settings);
    _.agHelper.GetNClick(_.appSettings.locators._navigationSettingsTab);
    _.agHelper.GetNClick(
      _.appSettings.locators._navigationSettings._orientationOptions._side,
    );
    _.agHelper.AssertElementExist(_.appSettings.locators._sideNavbar);
    // discard changes and verify
    _.gitSync.DiscardChanges();
    _.gitSync.VerifyChangeLog(false);
  });

  it("8. Bug 23858 : Branch list in git sync modal is not scrollable", function () {
    // create git branches
    _.gitSync.CreateGitBranch(tempBranch1, true);
    _.gitSync.CreateGitBranch(tempBranch2, true);
    _.gitSync.CreateGitBranch(tempBranch3, true);
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    _.agHelper.GetNClick(_.gitSync._bottomBarMergeButton);
    _.agHelper.AssertElementEnabledDisabled(
      _.gitSync._mergeBranchDropdownDestination,
      0,
      false,
    );
    _.agHelper.Sleep(6000); // adding wait for branch list to load
    _.agHelper.GetNClick(_.gitSync._mergeBranchDropdownDestination);
    // to verify scroll works and clicks on last branch in list
    _.agHelper.GetNClick(_.gitSync._dropdownmenu, 5);
    _.gitSync.CloseGitSyncModal();
  });

  it("9. Bug 24206 : Open repository button is not functional in git sync modal", function () {
    _.gitSync.SwitchGitBranch("master");
    _.appSettings.OpenPaneAndChangeTheme("Moon");
    _.gitSync.CommitAndPush();
    _.gitSync.SwitchGitBranch(tempBranch);
    _.appSettings.OpenPaneAndChangeTheme("Pampas");
    _.gitSync.CommitAndPush();
    _.gitSync.CheckMergeConflicts("master");
    cy.window().then((win) => {
      cy.stub(win, "open", (url) => {
        win.location.href = "http://host.docker.internal/";
      }).as("repoURL");
    });
    _.gitSync.OpenRepositoryAndVerify();
    cy.get("@repoURL").should("be.called");
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
