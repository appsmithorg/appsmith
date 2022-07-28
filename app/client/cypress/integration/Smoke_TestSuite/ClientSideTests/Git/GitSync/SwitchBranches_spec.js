import pages from "../../../../../locators/Pages.json";
import commonLocators from "../../../../../locators/commonlocators.json";
import explorer from "../../../../../locators/explorerlocators.json";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import jsActions from "../../../../../locators/jsActionLocators.json";

const parentBranchKey = "ParentBranch";
const childBranchKey = "ChildBranch";
const branchQueryKey = "branch";

let repoName;
describe("Git sync:", function() {
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

  it("1. create branch input", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.get(gitSyncLocators.branchButton).click();

    // validate of the branch name
    const hypenBranchName = "hypen-branch-name";
    cy.get(gitSyncLocators.branchSearchInput).type(
      `{selectall}${hypenBranchName}`,
    );
    cy.get(gitSyncLocators.branchSearchInput).should(
      "have.value",
      "hypen-branch-name",
    );

    const specialBranchName = "special&branch-name~@#$%^&*()_+={}[]><,.";
    cy.get(gitSyncLocators.branchSearchInput).type(
      `{selectall}${specialBranchName}`,
    );

    cy.get(gitSyncLocators.branchSearchInput).should(
      "have.value",
      "special_branch-name_____________________",
    );

    cy.wait(200);
    cy.get(gitSyncLocators.closeBranchList).click();
  });

  it("2. creates a new branch", function() {
    cy.get(commonLocators.canvas).click({ force: true });
    cy.createGitBranch(parentBranchKey);
  });

  it("3. creates branch specific resources", function() {
    cy.Createpage("ParentPage1");
    cy.get(pages.addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.CreateAPI("ParentApi1");
    cy.NavigateToJSEditor();
    cy.wait("@createNewJSCollection");
    cy.get(jsActions.name).click({ force: true });
    cy.get(jsActions.nameInput)
      .type("{selectall}ParentJsAction1", { force: true })
      .should("have.value", "ParentJsAction1")
      .blur();
    cy.wait("@renameJsAction");
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.createGitBranch(childBranchKey);

    cy.Createpage("ChildPage1");
    cy.get(pages.addEntityAPI)
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.CreateAPI("ChildApi1");
    cy.NavigateToJSEditor();
    cy.wait("@createNewJSCollection");
    cy.get(jsActions.name).click({ force: true });
    cy.get(jsActions.nameInput)
      .type("{selectall}ChildJsAction1", { force: true })
      .should("have.value", "ChildJsAction1")
      .blur();
    cy.wait("@renameJsAction");
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.GlobalSearchEntity("ParentPage1");
    cy.contains("ParentPage1").click();
    cy.get(commonLocators.canvas);

    cy.switchGitBranch(parentBranchKey);

    cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // rename entities
  it("4. makes branch specific resource updates", function() {
    cy.switchGitBranch(childBranchKey);
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.GlobalSearchEntity("ParentPage1");
    cy.RenameEntity("ParentPageRenamed", true);
    cy.GlobalSearchEntity("ParentApi1");
    cy.RenameEntity("ParentApiRenamed");
    // cy.GlobalSearchEntity("ChildJsAction1");
    // cy.RenameEntity("ParentJsActionRenamed");

    cy.switchGitBranch(parentBranchKey);

    cy.GlobalSearchEntity("ParentPageRenamed", true);
    cy.get(`.t--entity-name:contains("ParentPageRenamed")`).should("not.exist");
    cy.GlobalSearchEntity("ParentApiRenamed", true);
    cy.get(`.t--entity-name:contains("ParentApiRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentJsActionRenamed")`).should(
    //   "not.exist",
    // );
  });

  it("5. enables switching branch from the URL", () => {
    cy.url().then((url) => {
      cy.GlobalSearchEntity("ParentPage1");
      cy.contains("ParentPage1").click();
      cy.contains("ParentPage1").click(); // to unfurl
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
      cy.get(".t--widget-tablewidgetv2").should("exist");
      cy.commitAndPush();

      const urlObject = new URL(url);
      urlObject.searchParams.set(branchQueryKey, childBranchKey);
      cy.visit(urlObject.toString());

      cy.get(".bp3-spinner").should("exist");
      cy.get(".bp3-spinner").should("not.exist");

      cy.get(".t--widget-tablewidgetv2").should("not.exist");

      cy.commitAndPush();

      cy.get(homePage.deployPopupOptionTrigger).click();

      cy.get(homePage.currentDeployedPreviewBtn)
        .invoke("removeAttr", "target")
        .click();

      cy.wait("@getPagesForViewApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get(".t--widget-tablewidgetv2").should("not.exist");

      cy.url().then((url) => {
        const urlObject = new URL(url);
        urlObject.searchParams.set(branchQueryKey, parentBranchKey);
        cy.visit(urlObject.toString());

        cy.wait("@getPagesForViewApp").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );

        cy.get(".t--widget-tablewidgetv2").should("exist");
      });
    });
  });

  it("6. test sync and prune branches", () => {
    // uncomment once prune branch flow is complete
    const tempBranch = "featureA";
    const tempBranchRenamed = "newFeatureA";
    cy.goToEditFromPublish();
    cy.createGitBranch(tempBranch);
    cy.createGitBranch(`${tempBranch}-1`);
    cy.renameBranchViaGithubApi(repoName, tempBranch, tempBranchRenamed);
    cy.get(gitSyncLocators.branchButton).click();
    cy.get(gitSyncLocators.branchSearchInput).type(`{selectall}${tempBranch}`);
    const tempBranchRegex = new RegExp(`^${tempBranch}$`);
    const tempBranchRenamedRegex = new RegExp(`^${tempBranchRenamed}$`);
    const remoteTempBranchRenamedRegex = new RegExp(
      `^origin/${tempBranchRenamed}$`,
    );
    cy.get(gitSyncLocators.branchListItem).contains(tempBranchRegex);
    cy.get(gitSyncLocators.syncBranches).click();
    cy.get(gitSyncLocators.branchListItem)
      .contains(tempBranchRegex)
      .should("exist");
    cy.get(gitSyncLocators.branchListItem)
      .contains(remoteTempBranchRenamedRegex)
      .should("exist");

    cy.get(gitSyncLocators.closeBranchList).click();
    cy.switchGitBranch(`origin/${tempBranchRenamed}`);
    cy.switchGitBranch(`origin/${tempBranchRenamed}`, true);
    cy.wait(4000); // wait for switch branch
    // assert error toast
    cy.contains(`origin/${tempBranchRenamed} already exists`);
    cy.get(gitSyncLocators.closeBranchList).click();
  });

  // Validate the error faced when user switches between the branches
  it("7. error faced when user switches branch with new page", function() {
    cy.generateUUID().then((uuid) => {
      cy.createGitBranch(childBranchKey);
      cy.CheckAndUnfoldEntityItem("PAGES");
      cy.Createpage(uuid);
      cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.get(gitSyncLocators.branchSearchInput).type("{selectall}master");
      cy.wait(400);
      cy.get(gitSyncLocators.branchListItem)
        .contains("master")
        .click();
      cy.wait(4000);
      cy.contains("Page not found");
    });
  });

  it("8. branch list search", function() {
    cy.go("back");
    cy.reload();
    cy.get(".bp3-spinner").should("not.exist");
    cy.get(commonLocators.canvas).click({ force: true });
    cy.generateUUID().then((uuid1) => {
      cy.generateUUID().then((uuid2) => {
        const parentBranchKey = `${uuid1}branch`;
        const childBranchKey = `${uuid2}branch`;
        cy.createGitBranch(parentBranchKey);
        cy.createGitBranch(childBranchKey);

        cy.get(gitSyncLocators.branchButton).click();
        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${parentBranchKey.slice(0, 3)}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(parentBranchKey);

        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${childBranchKey.slice(0, 3)}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(childBranchKey);

        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${branchQueryKey}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(childBranchKey);
        cy.get(gitSyncLocators.branchListItem).contains(parentBranchKey);

        cy.get(gitSyncLocators.branchSearchInput).type(`{selectall}abcde`);
        cy.get(gitSyncLocators.branchListItem).should("not.exist");

        cy.get(gitSyncLocators.branchSearchInput).clear();
        cy.get(gitSyncLocators.branchListItem).contains(childBranchKey);
        cy.get(gitSyncLocators.branchListItem).contains(parentBranchKey);

        cy.get(gitSyncLocators.closeBranchList).click();
      });
    });
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
