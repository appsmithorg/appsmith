import * as _ from "../../../../../support/Objects/ObjectsCore";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch";

let repoName;
describe("Git sync:", function () {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
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

  it("2. when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    cy.dragAndDropToCanvas("containerwidget", { x: 100, y: 200 });

    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    _.autoLayout.convertToAutoLayoutAndVerify();

    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.verifyIsCurrentPage("Page1");
  });

  it("1. when snapshot is restored from a page created before Conversion, it should refresh in the same page", () => {
    _.autoLayout.convertToAutoLayoutAndVerify();

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.verifyIsCurrentPage("Page2");

    _.entityExplorer.SelectEntityByName("Page1", "Pages");

    cy.wait(1000);

    cy.Deletepage("Page2");
  });

  it("3. Switch to parentBranch and when snapshot is restored from a page created after Conversion, it should redirected to home page", () => {
    cy.switchGitBranch(parentBranchKey);

    _.autoLayout.convertToAutoLayoutAndVerify();

    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    _.autoLayout.useSnapshotFromBanner();

    _.entityExplorer.verifyIsCurrentPage("Page1");
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
