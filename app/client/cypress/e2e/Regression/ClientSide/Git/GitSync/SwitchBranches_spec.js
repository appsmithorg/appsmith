import commonLocators from "../../../../../locators/commonlocators.json";
import explorer from "../../../../../locators/explorerlocators.json";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch",
  branchQueryKey = "branch";

let repoName;
describe("Git sync:", function () {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    _.gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.wait(3000);
  });

  it("1. create branch input", function () {
    _.entityExplorer.NavigateToSwitcher("Widgets");
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
      "special&branch-name~@#$%^&*()_+={}[]><,.",
    );

    cy.wait(200);
    cy.get(gitSyncLocators.closeBranchList).click();
  });

  it("2. creates a new branch and create branch specific resources", function () {
    cy.get(commonLocators.canvas).click({ force: true });
    //cy.createGitBranch(parentBranchKey);
    _.gitSync.CreateGitBranch(parentBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      parentBranchKey = branName;
    });

    _.entityExplorer.AddNewPage();
    _.entityExplorer.RenameEntityFromExplorer("Page2", "ParentPage1", true);
    _.dataSources.NavigateToDSCreateNew();
    _.apiPage.CreateApi("ParentApi1");
    _.jsEditor.CreateJSObject();
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    _.gitSync.CreateGitBranch(childBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      childBranchKey = branName;
    });
    _.entityExplorer.AddNewPage();
    _.entityExplorer.RenameEntityFromExplorer("Page2", "ChildPage1", true);
    _.dataSources.NavigateToDSCreateNew();
    _.apiPage.CreateApi("ChildApi1");
    _.jsEditor.CreateJSObject();
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // A switch here should not show a 404 page
    cy.switchGitBranch(parentBranchKey);
    // When entity not found, takes them to the home page
    cy.get(`.t--entity.page`)
      .contains("Page1")
      .closest(".t--entity")
      .should("be.visible")
      .should("have.class", "activePage");

    cy.CheckAndUnfoldEntityItem("Pages");

    cy.get(`.t--entity-name:contains("ParentPage1")`).click();
    cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // rename entities
  it("3. makes branch specific resource updates", function () {
    cy.switchGitBranch(childBranchKey);
    _.entityExplorer.SelectEntityByName("ParentPage1", "Pages");
    _.entityExplorer.RenameEntityFromExplorer(
      "ParentPage1",
      "ParentPageRenamed",
      true,
    );
    _.entityExplorer.SelectEntityByName("ParentApi1", "Queries/JS");
    _.entityExplorer.RenameEntityFromExplorer(
      "ParentApi1",
      "ParentApiRenamed",
      true,
    );

    cy.switchGitBranch(parentBranchKey);

    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("ParentPageRenamed")`).should("not.exist");
    cy.get(`.t--entity-name:contains("ParentApiRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentJsActionRenamed")`).should(
    //   "not.exist",
    // );
  });

  it("4. enables switching branch from the URL", () => {
    cy.url().then((url) => {
      _.entityExplorer.SelectEntityByName("ParentPage1", "Pages");
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
      cy.get(".t--widget-tablewidgetv2").should("exist");
      cy.commitAndPush();

      const urlObject = new URL(url);
      urlObject.searchParams.set(branchQueryKey, childBranchKey);
      cy.visit(urlObject.toString());

      cy.get(".ads-v2-spinner").should("exist");
      cy.get(".ads-v2-spinner").should("not.exist");

      cy.get(".t--widget-tablewidgetv2").should("not.exist");

      cy.commitAndPush();

      cy.latestDeployPreview();

      cy.get(".t--widget-tablewidgetv2").should("not.exist");
      //cy.get(commonLocators.backToEditor).click();
      cy.wait(2000);
      cy.url().then((url) => {
        const urlObject = new URL(url);
        urlObject.searchParams.set(branchQueryKey, parentBranchKey);
        cy.visit(urlObject.toString());

        cy.wait("@getPagesForViewApp").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.get(".t--page-switch-tab").contains("ParentPage1").click();
        cy.get(".t--widget-tablewidgetv2").should("exist");
      });
    });
  });

  //Rename - hence skipping for Gitea
  it.skip("5. test sync and prune branches", () => {
    // uncomment once prune branch flow is complete
    let tempBranch = "featureA";
    const tempBranchRenamed = "newFeatureA";
    _.deployMode.NavigateBacktoEditor();
    _.gitSync.CreateGitBranch(tempBranch, true);
    cy.get("@gitbranchName").then((branName) => {
      tempBranch = branName;
    });
    _.gitSync.CreateGitBranch(`${tempBranch}-1`, true);
    // cy.get("@gitbranchName").then((branName) => {
    //   tempBranch = branName;
    // });
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
  it("6. no error faced when user switches branch with new page", function () {
    _.deployMode.NavigateBacktoEditor(); //Adding since skipping 6th case
    cy.generateUUID().then((uuid) => {
      _.gitSync.CreateGitBranch(childBranchKey, true);
      //cy.createGitBranch(childBranchKey);
      cy.CheckAndUnfoldEntityItem("Pages");
      _.entityExplorer.AddNewPage();
      cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.get(gitSyncLocators.branchSearchInput).type("{selectall}master");
      cy.wait(400);
      cy.get(gitSyncLocators.branchListItem).contains("master").click();
      cy.wait(4000);
      _.entityExplorer.NavigateToSwitcher("Widgets");
      cy.get(`.t--entity.page`)
        .contains("Page1")
        .closest(".t--entity")
        .should("be.visible")
        .should("have.class", "activePage");
      cy.get(".t--canvas-artboard").should("be.visible");
    });
    cy.reload();
  });

  it("7. branch list search", function () {
    cy.get(".ads-v2-spinner").should("not.exist");
    _.entityExplorer.NavigateToSwitcher("Widgets");
    cy.get(commonLocators.canvas).click({ force: true });
    let parentBKey, childBKey;
    _.gitSync.CreateGitBranch("parentBranch", true);
    cy.get("@gitbranchName").then((branName) => {
      parentBKey = branName;

      _.gitSync.CreateGitBranch("childBranch", true);
      cy.get("@gitbranchName").then((branName) => {
        childBKey = branName;

        cy.get(gitSyncLocators.branchButton).click();
        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${parentBKey.slice(0, 3)}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(parentBKey);

        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${childBKey.slice(0, 3)}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(childBKey);

        cy.get(gitSyncLocators.branchSearchInput).type(
          `{selectall}${branchQueryKey}`,
        );
        cy.get(gitSyncLocators.branchListItem).contains(childBKey);
        cy.get(gitSyncLocators.branchListItem).contains(parentBKey);

        cy.get(gitSyncLocators.branchSearchInput).type(`{selectall}abcde`);
        cy.get(gitSyncLocators.branchListItem).should("not.exist");

        cy.get(gitSyncLocators.branchSearchInput).clear();
        cy.get(gitSyncLocators.branchListItem).contains(childBKey);
        cy.get(gitSyncLocators.branchListItem).contains(parentBKey);
      });
    });
    cy.get(gitSyncLocators.closeBranchList).click();
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
