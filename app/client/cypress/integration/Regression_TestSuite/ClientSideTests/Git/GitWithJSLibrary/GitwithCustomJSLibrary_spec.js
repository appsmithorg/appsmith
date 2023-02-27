import HomePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const explorer = ObjectsRegistry.EntityExplorer;
const installer = ObjectsRegistry.LibraryInstaller;
const agHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;
const deployMode = ObjectsRegistry.DeployMode;
const debuggerHelper = ObjectsRegistry.DebuggerHelper;
const gitSync = ObjectsRegistry.GitSync;
let repoName;
let mainBranch = "master";
let tempBranch = "feat/tempBranch";

describe("Tests JS Library with Git", () => {
  before(() => {
    // connect app to git
    _.gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });
  it("1. Install JS Library and commit changes, create branch and verify JS library changes are present on new branch ", () => {
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("uuidjs", "UUID");
    cy.commitAndPush();
    // create new branch
    _.gitSync.CreateGitBranch(tempBranch, true);
    // verify js library changes are present
    explorer.ExpandCollapseEntity("Libraries");
    installer.assertLibraryinExplorer("uuidjs");
  });
  it("2. Discard custom js library changes, verify changes are discarded also verify it deosnt show uncommitted changes", () => {
    explorer.ExpandCollapseEntity("Libraries");
    installer.uninstallLibrary("uuidjs");
    installer.assertUnInstall("uuidjs");
    // discard js library uninstallation
    cy.gitDiscardChanges();
    // verify js library is present
    explorer.ExpandCollapseEntity("Libraries");
    installer.assertLibraryinExplorer("uuidjs");
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
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("jspdf", "jspdf");
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
    agHelper.AssertElementExist(gitSync._bottomBarPull);
    explorer.ExpandCollapseEntity("Libraries");
    installer.assertLibraryinExplorer("jspdf");
  });
  after(() => {
    //clean up
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
