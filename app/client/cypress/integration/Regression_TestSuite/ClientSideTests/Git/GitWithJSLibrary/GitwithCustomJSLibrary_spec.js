import HomePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const mainBranch = "master";
const tempBranch = "feat/tempBranch";
let repoName;

describe("Tests JS Library with Git", () => {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    // connect app to git
    _.gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("1. Install JS Library and commit changes, create branch and verify JS library changes are present on new branch ", () => {
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.openInstaller();
    _.installer.installLibrary("uuidjs", "UUID");
    cy.commitAndPush();
    // create new branch
    _.gitSync.CreateGitBranch(tempBranch, true);
    // verify js library changes are present
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.AssertLibraryinExplorer("uuidjs");
  });
  it("2. Discard custom js library changes, verify changes are discarded also verify it deosnt show uncommitted changes", () => {
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.uninstallLibrary("uuidjs");
    _.installer.assertUnInstall("uuidjs");
    // discard js library uninstallation
    cy.gitDiscardChanges();
    // verify js library is present
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.AssertLibraryinExplorer("uuidjs");
    // verify no uncommitted changes are there
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // swtich to master, verify no uncommitted changes
    cy.switchGitBranch("master");
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("3. Merge custom js lib changes from child branch to master, verify changes are merged", () => {
    cy.switchGitBranch(tempBranch);
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.openInstaller();
    _.installer.installLibrary("jspdf", "jspdf");
    //cy.commitAndPush();

    cy.get(HomePage.publishButton).click();
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    // verify custom js library is present in master branch
    cy.switchGitBranch(mainBranch);
    _.agHelper.AssertElementExist(_.gitSync._bottomBarPull);
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.AssertLibraryinExplorer("jspdf");
  });
  after(() => {
    //clean up
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
