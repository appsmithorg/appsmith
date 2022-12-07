import commonLocators from "../../../../../locators/commonlocators.json";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

let dataSources = ObjectsRegistry.DataSources;
let testBranchName = "Test";

let repoName;
describe("Bug 18665: Git sync:", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    cy.generateUUID().then((uid) => {
      repoName = "test" + uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("1. creates a new branch", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.generateUUID().then((uid) => {
      testBranchName += uid;
      cy.createGitBranch(testBranchName + uid);
    });
  });

  it("2. Create datasource, discard it and check current branch", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("PostgreSQL");
    dataSources.SaveDSFromDialog(false);
    cy.get(gitSyncLocators.branchButton)
      .contains(testBranchName)
      .should("be.visible");
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
