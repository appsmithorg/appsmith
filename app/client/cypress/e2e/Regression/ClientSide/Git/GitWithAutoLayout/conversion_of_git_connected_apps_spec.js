import * as _ from "../../../../../support/Objects/ObjectsCore";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch";

let repoName;
describe("Git sync:", function () {
  before(() => {
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("AutoLayoutGit" + uid);
      _.homePage.CreateAppInWorkspace("AutoLayoutGit" + uid);
    });

    _.gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.wait(3000);

    _.gitSync.CreateGitBranch(parentBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      parentBranchKey = branName;
    });

    _.gitSync.CreateGitBranch(childBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      childBranchKey = branName;
    });
  });

  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.CONTAINER,
      100,
      100,
    );

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.ConvertToAutoLayoutAndVerify();

    _.autoLayout.UseSnapshotFromBanner();

    _.entityExplorer.VerifyIsCurrentPage("Page2");

    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    _.entityExplorer.ActionContextMenuByEntityName("Page2");
  });

  //Skipped these tests as they seemed to have regressed again, will enable them once it is fixed. #22956
  it.skip("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    _.autoLayout.ConvertToAutoLayoutAndVerify();

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.UseSnapshotFromBanner();

    _.entityExplorer.VerifyIsCurrentPage("Page1");
  });

  //Skipped these tests as they seemed to have regressed again, will enable them once it is fixed. #22956
  it.skip("3. Switch to parentBranch and when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    cy.switchGitBranch(parentBranchKey);

    _.autoLayout.ConvertToAutoLayoutAndVerify();

    _.entityExplorer.AddNewPage("New blank page");

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.VerifyIsCurrentPage("Page1");
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
