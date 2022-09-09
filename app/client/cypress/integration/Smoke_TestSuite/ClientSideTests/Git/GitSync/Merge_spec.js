import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import commonLocators from "../../../../../locators/commonlocators.json";

let repoName;
let childBranchKey = "ChildBranch";
let mainBranch = "master";
describe("Git sync modal: merge tab", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("Verify the functionality of the default dropdown under merge tab", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.createGitBranch(childBranchKey);

    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.gitSyncModal).should("exist");
    cy.get("[data-cy=t--tab-MERGE]").should("exist");
    cy.get("[data-cy=t--tab-MERGE]")
      .invoke("attr", "aria-selected")
      .should("eq", "true");

    cy.get(gitSyncLocators.mergeButton).should("be.disabled");
    cy.get(gitSyncLocators.mergeBranchDropdownDestination).click();
    cy.get(commonLocators.dropdownmenu)
      .contains(mainBranch)
      .click();
    cy.wait(2000);
    cy.get(gitSyncLocators.mergeButton).should("be.enabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
