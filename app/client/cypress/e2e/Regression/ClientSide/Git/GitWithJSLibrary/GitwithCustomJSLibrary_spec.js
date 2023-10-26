import HomePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import {
  agHelper,
  entityExplorer,
  homePage,
  gitSync,
  installer,
} from "../../../../../support/Objects/ObjectsCore";

const mainBranch = "master";
const tempBranch = "feat/tempBranch";
let repoName;

describe("excludeForAirgap", "Tests JS Library with Git", () => {
  before(() => {
    homePage.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    // connect app to git
    gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("1. Install JS Library and commit changes, create branch and verify JS library changes are present on new branch ", () => {
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.OpenInstaller();
    installer.InstallLibrary("uuidjs", "UUID");
    gitSync.CommitAndPush();
    // create new branch
    gitSync.CreateGitBranch(tempBranch, true);
    // verify js library changes are present
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.AssertLibraryinExplorer("uuidjs");
  });

  it("2. Discard custom js library changes, verify changes are discarded also verify it deosnt show uncommitted changes", () => {
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.uninstallLibrary("uuidjs");
    installer.assertUnInstall("uuidjs");
    // discard js library uninstallation
    cy.gitDiscardChanges();
    // verify js library is present
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.AssertLibraryinExplorer("uuidjs");
    // verify no uncommitted changes are there
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // swtich to master, verify no uncommitted changes
    cy.switchGitBranch("master");
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("3. Merge custom js lib changes from child branch to master, verify changes are merged", () => {
    cy.switchGitBranch(tempBranch);
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.OpenInstaller();
    installer.InstallLibrary("jspdf", "jspdf");
    //cy.commitAndPush();

    cy.get(HomePage.publishButton).click();
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    // verify custom js library is present in master branch
    cy.switchGitBranch(mainBranch);
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    entityExplorer.ExpandCollapseEntity("Libraries");
    installer.AssertLibraryinExplorer("jspdf");
  });
  after(() => {
    //clean up
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
