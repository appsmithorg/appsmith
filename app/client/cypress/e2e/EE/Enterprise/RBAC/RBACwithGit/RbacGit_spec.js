import homePageLocators from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
const RBAC = require("../../../../../locators/RBAClocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");
import {
  gitSync,
  entityExplorer,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe.skip("RBAC for git connected apps tests", function () {
  let workspaceName;
  let appName;
  let newWorkspaceName;
  let repoName;
  const mainBranch = "master";
  const childBranch =
    "test/childBranch" + `${Math.floor(Math.random() * 1000)}`;
  const childBranch2 =
    "test/childBranch2" + `${Math.floor(Math.random() * 1000)}`;
  const childBranch3 =
    "test/childBranch3" + `${Math.floor(Math.random() * 1000)}`;
  const importedApp = "gitImportedApp";
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });
  before(() => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.AddIntercepts();
    homePage.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid + "app";
      localStorage.setItem("WorkspaceName", workspaceName);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        homePage.RenameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);

      gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });

      cy.visit("settings/general");
      cy.CreatePermissionWorkspaceLevel(
        PermissionWorkspaceLevel,
        workspaceName,
      );
      cy.AssignRoleToUser(
        PermissionWorkspaceLevel,
        Cypress.env("TESTUSERNAME1"),
      );
    });
  });

  it("1. Login as test user with create permission at workspace level, create new branch and assert given permissions", function () {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    gitSync.CreateGitBranch(childBranch);
    //cy.createGitBranch(childBranch);
    // verify user is able to create JSObject
    cy.createJSObject('return "Success";');
    // verify user is able to edit the page
    entityExplorer.NavigateToSwitcher("Widgets");
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    // verify user is able to create new page
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page3");
    // commit and merge it to master
    cy.get(homePageLocators.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("2. Discard changes on master branch and verify , discarded page don't show on Roles screen", function () {
    cy.switchGitBranch(mainBranch);
    cy.Createpage("page4");
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    // verify new page is deleted after discarding changes
    cy.get(`.t--entity-name:contains(page4)`).should("not.exist");
  });

  it("3. Switch to new branch from test branch and verify permissions ", function () {
    // verify the page merged is there on roles screen
    gitSync.CreateGitBranch(childBranch2, true);
    // verify user is able to create JSObject
    cy.createJSObject('return "Success";');
    cy.LogOut();
  });

  it.skip("4. Login as admin, edit the existing role: update from create to edit permission", function () {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.get(RBAC.searchBar).clear().wait(2000).type(PermissionWorkspaceLevel);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", PermissionWorkspaceLevel)
      .click();
    cy.contains("td", `${workspaceName}`).click();
    // verify the page merged from child branch shows on roles screen
    cy.xpath(`//span[text()="${appName}"]`).last().click();
    cy.contains("td", `page3`).scrollIntoView().should("be.visible");
    // update the role's permission by unchecking create permission
    cy.contains("td", `${workspaceName}`).next().click();
    // check the edit permission
    cy.contains("td", `${workspaceName}`).next().next().click();
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // give create workspace permission
    cy.get(RBAC.othersTab).click();
    cy.wait(2000);
    cy.contains("td", "Workspaces").next().click();
    cy.get(RBAC.saveButton).click();
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.LogOut();
  });

  it.skip("5. Login as test user, create new branch and verify given permission on new and old branch ", function () {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.switchGitBranch(childBranch);
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.createGitBranch(childBranch3);
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
  });

  it.skip("6. Delete branch and verify permissions", function () {
    cy.switchGitBranch(mainBranch);
    cy.wait(3000);
    cy.get(gitSyncLocators.branchButton).click();
    cy.get(gitSyncLocators.branchListItem)
      .eq(1)
      .trigger("mouseenter")
      .within(() => {
        cy.wait(1000);
        cy.get(gitSyncLocators.gitBranchContextMenu).click();
        cy.wait(1000);
        cy.get(gitSyncLocators.gitBranchDelete).click();
      });
    cy.wait("@deleteBranch").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it.skip("7. Import an app from git and verify functionality", function () {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.get(homePageLocators.searchInput).clear();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, importedApp);
    });
    cy.get(homePageLocators.homeIcon).click();
    cy.get(homePageLocators.optionsIcon).first().click();
    cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card").next().click();
    cy.importAppFromGit(repoName);
  });

  after(() => {
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
