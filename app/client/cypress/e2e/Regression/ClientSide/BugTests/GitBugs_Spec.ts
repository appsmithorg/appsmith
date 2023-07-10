import * as _ from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

let repoName: any;
let tempBranch: any;
let statusBranch: any;

describe("Git Bugs", function () {
  before(() => {
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("GitBugs" + uid);
      _.homePage.CreateAppInWorkspace("GitBugs" + uid);
    });
  });

  it("1. Bug 16248, When GitSync modal is open, block shortcut action execution", function () {
    const largeResponseApiUrl = datasourceFormData.mockApiUrl;
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    _.apiPage.CreateAndFillApi(largeResponseApiUrl, "GitSyncTest");
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
      _.dataSources.SaveDSFromDialog(false);
      _.agHelper.AssertElementVisible(_.gitSync._branchButton);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });
  });
  it("3. Bug 18376:  navigateTo fails to set queryParams if the app is connected to Git", () => {
    _.entityExplorer.AddNewPage();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT);
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
    _.propPane.EnterJSContext(
      "onClick",
      "{{navigateTo('Page2', {testQP: 'Yes'}, 'SAME_WINDOW')}}",
      true,
      true,
    );
    _.propPane.ToggleJSMode("onClick", false);
    _.agHelper.Sleep(500);
    _.entityExplorer.SelectEntityByName("Page2", "Pages");
    _.entityExplorer.SelectEntityByName("Text1", "Widgets");
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{appsmith.URL.queryParams.testQP}}",
    );
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
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
      _.agHelper.GetNClick(_.locators._appEditMenuBtn);
      // cy.wait(_.locators._appEditMenu);
      _.agHelper.GetNClick(_.locators._appEditMenuSettings);
      _.agHelper.GetNClick(_.locators._appThemeSettings);
      _.agHelper.GetNClick(_.locators._appChangeThemeBtn, 0, true);
      _.agHelper.GetNClick(_.locators._appThemeCard, 2);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.locators._gitStatusChanges);
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").CHANGES_THEME(),
        "exist",
        _.locators._gitStatusChanges,
      );
      _.agHelper.GetNClick(_.locators._dialogCloseButton);
      _.agHelper.GetNClick(_.locators._appEditMenuBtn);
      // cy.wait(_.locators._appEditMenu);
      _.agHelper.GetNClick(_.locators._appEditMenuSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettingsShowTitle);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.locators._gitStatusChanges);
      _.agHelper.AssertContains(
        Cypress.env("MESSAGES").CHANGES_APP_SETTINGS(),
        "exist",
        _.locators._gitStatusChanges,
      );
      _.agHelper.GetNClick(_.locators._dialogCloseButton);
    });
  });

  it("5. Bug 24946 : Discard message is missing when only navigation settings are changed", function () {
    _.gitSync.SwitchGitBranch("master");
    _.gitSync.CreateGitBranch(`b24946`, true);
    cy.get("@gitbranchName").then((branchName) => {
      statusBranch = branchName;
      _.agHelper.GetNClick(_.locators._appEditMenuBtn);
      _.agHelper.GetNClick(_.locators._appEditMenuSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettings);
      _.agHelper.GetNClick(_.locators._appNavigationSettingsShowTitle);
      _.agHelper.GetNClick(_.locators._publishButton);
      _.agHelper.WaitUntilEleAppear(_.locators._gitStatusChanges);
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

  it("6. Bug 24920: Not able to discard app settings changes for the first time in git connected app ", function () {
    // add navigation settings changes
    _.agHelper.GetNClick(_.appSettings.locators._appSettings);
    _.agHelper.GetNClick(_.appSettings.locators._navigationSettingsTab);
    _.agHelper.GetNClick(
      _.appSettings.locators._navigationSettings._orientationOptions._side,
    );
    _.agHelper.AssertElementExist(_.appSettings.locators._sideNavbar);
    // discard
    _.gitSync.DiscardChanges();
    _.gitSync.VerifyChangeLog(false);

    // add canvas changes, discard and verify
  });

  it("7. Bug 23858 : Branch list in git sync modal is not scrollable", function () {
    // create git branches
    _.gitSync.CreateGitBranch(`test1`, true);
    cy.get("@gitbranchName").then((branchName) => {
      statusBranch = branchName;
    });

    it("8. Bug 24206 : Open repository button is not functional in git sync modal", function () {
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

    //after(() => {
    //  _.gitSync.DeleteTestGithubRepo(repoName);
    // });
  });
});
