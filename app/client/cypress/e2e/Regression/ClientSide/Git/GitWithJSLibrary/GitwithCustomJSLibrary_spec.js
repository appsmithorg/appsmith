import HomePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import {
  agHelper,
  homePage,
  gitSync,
  installer,
} from "../../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../../support/Pages/EditorNavigation";

const mainBranch = "master";
const tempBranch = "feat/tempBranch";
let repoName;

describe(
  "Tests JS Library with Git",
  {
    tags: [
      "@tag.Git",
      "@tag.excludeForAirgap",
      "@tag.Sanity",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  () => {
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
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("uuidjs", "UUID");
      gitSync.CommitAndPush();
      // create new branch
      gitSync.CreateGitBranch(tempBranch, true);
      // verify js library changes are present
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.AssertLibraryinExplorer("uuidjs");
    });

    it("2. Discard custom js library changes, verify changes are discarded also verify it deosnt show uncommitted changes", () => {
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.uninstallLibrary("uuidjs");
      // discard js library uninstallation
      gitSync.DiscardChanges();
      // verify js library is present
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.AssertLibraryinExplorer("uuidjs");
      // verify no uncommitted changes are there
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      cy.get(gitSyncLocators.bottomBarCommitButton).click();
      cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
      cy.get(gitSyncLocators.commitButton).should("be.disabled");
      cy.get(gitSyncLocators.closeGitSyncModal).click();
      AppSidebar.navigate(AppSidebarButton.Editor);
      // swtich to master, verify no uncommitted changes
      cy.switchGitBranch("master");
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      cy.get(gitSyncLocators.bottomBarCommitButton).click();
      cy.get(gitSyncLocators.commitCommentInput).should("be.disabled");
      cy.get(gitSyncLocators.commitButton).should("be.disabled");
      cy.get(gitSyncLocators.closeGitSyncModal).click();
    });

    it("3. Merge custom js lib changes from child branch to master, verify changes are merged", () => {
      cy.switchGitBranch(tempBranch);
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.OpenInstaller();
      installer.InstallLibrary("jspdf", "jspdf");
      //cy.commitAndPush();

      cy.get(HomePage.publishButton).click();
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
      cy.get(gitSyncLocators.commitButton).click();
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      cy.get(gitSyncLocators.closeGitSyncModal).click();
      cy.merge(mainBranch);
      cy.get(gitSyncLocators.closeGitSyncModal).click();
      AppSidebar.navigate(AppSidebarButton.Editor);
      // verify custom js library is present in master branch
      cy.switchGitBranch(mainBranch);
      agHelper.AssertElementExist(gitSync.locators.quickActionsPullBtn);
      AppSidebar.navigate(AppSidebarButton.Libraries);
      installer.AssertLibraryinExplorer("jspdf");
    });
    after(() => {
      //clean up
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
