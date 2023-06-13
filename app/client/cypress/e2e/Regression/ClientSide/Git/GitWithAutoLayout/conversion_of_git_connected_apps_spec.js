import {
  homePage,
  agHelper,
  autoLayout,
  gitSync,
  entityExplorer,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch";

let repoName;
describe("Git sync:", function () {
  before(() => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      homePage.CreateNewWorkspace("AutoLayoutGit" + uid);
      homePage.CreateAppInWorkspace("AutoLayoutGit" + uid);
    });

    gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.wait(3000);

    gitSync.CreateGitBranch(parentBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      parentBranchKey = branName;
    });

    gitSync.CreateGitBranch(childBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      childBranchKey = branName;
    });
  });

  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CONTAINER, 100, 100);

    entityExplorer.AddNewPage("New blank page");

    autoLayout.ConvertToAutoLayoutAndVerify();

    autoLayout.UseSnapshotFromBanner();

    entityExplorer.VerifyIsCurrentPage("Page2");

    entityExplorer.SelectEntityByName("Page1", "Pages");

    agHelper.Sleep();

    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Page2",
    });
  });

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    autoLayout.ConvertToAutoLayoutAndVerify();

    entityExplorer.AddNewPage("New blank page");

    autoLayout.UseSnapshotFromBanner();

    entityExplorer.VerifyIsCurrentPage("Page1");
  });

  it("3. Switch to parentBranch and when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    cy.switchGitBranch(parentBranchKey);

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CONTAINER, 100, 100);

    autoLayout.ConvertToAutoLayoutAndVerify();

    entityExplorer.AddNewPage("New blank page");

    autoLayout.UseSnapshotFromBanner();

    entityExplorer.VerifyIsCurrentPage("Page1");
  });

  after(() => {
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
