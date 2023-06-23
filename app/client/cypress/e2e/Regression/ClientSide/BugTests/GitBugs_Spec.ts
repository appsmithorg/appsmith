import * as _ from "../../../../support/Objects/ObjectsCore";

let repoName: any;
let tempBranch: any;

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
    const largeResponseApiUrl = "https://jsonplaceholder.typicode.com/users";
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

  it("4. Bug 24206 : Open repository button is not functional in git sync modal", function () {
    _.gitSync.SwitchGitBranch("master");
    _.entityExplorer.DragDropWidgetNVerify("modalwidget", 50, 50);
    _.gitSync.CommitAndPush();
    _.gitSync.SwitchGitBranch(tempBranch);
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

  // it.only("4. Import application json and validate headers", () => {
  //   _.homePage.NavigateToHome();
  //   _.homePage.ImportApp("DeleteGitRepos.json");
  //   _.deployMode.DeployApp();
  //   _.agHelper.Sleep(2000);
  //   for (let i = 0; i < 100; i++) {
  //     _.agHelper.ClickButton("Delete");
  //   }
  // });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
