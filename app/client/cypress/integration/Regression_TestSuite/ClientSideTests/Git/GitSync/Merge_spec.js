import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import commonLocators from "../../../../../locators/commonlocators.json";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName;
let childBranchKey = "ChildBranch";
let mainBranch = "master";
describe("Git sync modal: merge tab", function () {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    _.gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("1. Verify the functionality of the default dropdown under merge tab", function () {
    cy.get(commonLocators.canvas).click({ force: true });
    _.gitSync.CreateGitBranch(childBranchKey);
    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.gitSyncModal).should("exist");
    cy.get("[data-cy=t--tab-MERGE]").should("exist");
    cy.get("[data-cy=t--tab-MERGE]")
      .invoke("attr", "aria-selected")
      .should("eq", "true");

    cy.get(gitSyncLocators.mergeButton).should("be.disabled");
    cy.wait(3000);
    cy.get(gitSyncLocators.mergeBranchDropdownDestination).click();
    cy.get(commonLocators.dropdownmenu).contains(mainBranch).click();
    _.agHelper.AssertElementAbsence(_.gitSync._checkMergeability, 30000);

    cy.wait("@mergeStatus", { timeout: 35000 }).should(
      "have.nested.property",
      "response.body.data.isMergeAble",
      true,
    );
    cy.wait(2000);
    cy.get(gitSyncLocators.mergeButton).should("be.enabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
