describe("Create Permission flow ", function() {
  const datasourceName = "users";
  let workspaceName;
  let appName;
  let newWorkspaceName;
  let repoName;
  const mainBranch = "master";
  const pageName = "testPage";
  const jsObject = "JSObject2";
  const childBranch = "test/childBranch";
  const childBranch2 = "test/childBranch2";
  const childBranch3 = "test/childBranch3";
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });
  before(() => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.AddIntercepts();
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid + "app";
      localStorage.setItem("WorkspaceName", workspaceName);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
    cy.visit("settings/general");
    cy.CreatePermissionWorkspaceLevel(PermissionWorkspaceLevel, workspaceName);
    cy.AssignRoleToUser(PermissionWorkspaceLevel, Cypress.env("TESTUSERNAME1"));
  });

  it("1. Login as test user with create permission at workspace level, create new branch and assert given permissions", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    cy.createGitBranch(childBranch);
    // verify user is able to create JSObject
    cy.createJSObject('return "Success";');
    // verify user is able to create new page
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page3");
    // commit and merge it to master
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("2. Discard changes on master branch and verify , discared page dont show in Roles screen", function() {
    cy.switchGitBranch(mainBranch);
    cy.createJSObject('return "yo";');
    cy.gitDiscardChanges();
    cy.wait(5000);
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    // verify jsObject2 is deleted after discarding changes
    cy.get(`.t--entity-name:contains(${jsObject})`).should("not.exist");
  });

  it("3. Switch to branch 1 from test branch and verify permissions ", function() {
    // verify the page merged is there on roles screen
    cy.createGitBranch(childBranch2);
    // verify user is able to create JSObject
    cy.createJSObject('return "Success";');
    cy.LogOut();
  });

  it("4. Login as admin, edit the existing role ", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit(/settings/elors);
    cy.get(RBAC.searchBar)
      .clear()
      .type(Role);
    cy.wait(2000);
    cy.get(RBAC.roleRow)
      .first()
      .should("have.text", PermissionWorkspaceLevel)
      .click();
    cy.contains("td", `${WorkspaceName}`).click();
    cy.contains("td", `${AppName}`)
      .next()
      .next()
      .click();
    cy.xpath(`//span[text()="${AppName}"]`)
      .last()
      .click();
    // verify the page merged from child branch shows on roles screen
    cy.contains("td", `${PageName}`)
      .next()
      .should("be.checked");
    // update the role's permission by unchecking create permission
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .click();
    // check the edit permission
    cy.contains("td", `${WorkspaceName}`)
      .next()
      .next()
      .click();
    cy.get(RBAC.saveButton).click();
    // save api call
    cy.wait(2000);
    cy.wait("@saveRole").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.LogOut();
  });

  it("5. Login as test user, create new branch and verify given permission on new and old branch ", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.get(homePage.searchInput)
      .clear()
      .type(appName2);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.switchGitBranch(childBranch);
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.createGitBranch(childBranch3);
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
  });

  it("6. Delete branch and again restore from remote branch and verify permissions", function() {
    cy.switchGitBranch(mainBranch);
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

  it("7. Import an app from git and verify functionality", function() {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, "gitImport");
    });
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.workspaceImportAppOption).click({ force: true });
    cy.get(".t--import-json-card")
      .next()
      .click();
    cy.importAppFromGit(repoName);
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
