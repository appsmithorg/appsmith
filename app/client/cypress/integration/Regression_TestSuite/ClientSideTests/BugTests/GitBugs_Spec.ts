import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

let repoName: any;
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
    _.agHelper.ValidateNetworkStatus("@postExecute");
  });

  it("2. Bug 18665 : Creates a new Git branch, Create datasource, discard it and check current branch", function () {
    _.gitSync.CreateNConnectToGit();
    _.gitSync.CreateGitBranch();
    _.dataSources.NavigateToDSCreateNew();
    _.dataSources.CreatePlugIn("PostgreSQL");
    _.dataSources.SaveDSFromDialog(false);
    _.agHelper.AssertElementVisible(_.gitSync._branchButton);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("3. Bug 18376:  navigateTo fails to set queryParams if the app is connected to Git", () => {
    _.entityExplorer.AddNewPage();
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.TEXT);
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON);
    _.propPane.SelectPropertiesDropDown("onClick", "Navigate to");
    _.agHelper.Sleep(500);
    _.propPane.SelectPropertiesDropDown("onClick", "Page2", "Page");
    _.agHelper.EnterActionValue("Query Params", `{{{testQP: "Yes"}}}`);
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
    _.agHelper.ValidateURL("branch=" + repoName); //Validate we are still in Git branch
    _.agHelper.ValidateURL("testQP=Yes"); //Validate we also ve the Query Params from Page1
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
