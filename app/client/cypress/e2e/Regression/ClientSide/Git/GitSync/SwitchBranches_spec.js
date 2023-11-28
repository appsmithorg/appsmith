import commonLocators from "../../../../../locators/commonlocators.json";
import explorer from "../../../../../locators/explorerlocators.json";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
  homePage,
  gitSync,
  apiPage,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch",
  branchQueryKey = "branch";

let repoName;
describe("Git sync:", function () {
  before(() => {
    homePage.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });

    gitSync.CreateNConnectToGit();
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.wait(3000);
  });

  it("1. create branch input", function () {
    PageLeftPane.switchSegment(PagePaneSegment.Widgets);
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

  it("2. creates a new branch and create branch specific resources", function () {
    cy.get(commonLocators.canvas).click({ force: true });
    //cy.createGitBranch(parentBranchKey);
    gitSync.CreateGitBranch(parentBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      parentBranchKey = branName;
    });

    PageList.AddNewPage();
    entityExplorer.RenameEntityFromExplorer("Page2", "ParentPage1", true);
    dataSources.NavigateToDSCreateNew();
    apiPage.CreateApi("ParentApi1");
    jsEditor.CreateJSObject();
    // Added because api name edit takes some time to
    // reflect in api sidebar after the call passes.
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    gitSync.CreateGitBranch(childBranchKey, true);
    cy.get("@gitbranchName").then((branName) => {
      childBranchKey = branName;
    });
    PageList.AddNewPage();
    entityExplorer.RenameEntityFromExplorer("Page2", "ChildPage1", true);
    dataSources.NavigateToDSCreateNew();
    apiPage.CreateApi("ChildApi1");
    jsEditor.CreateJSObject();
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

    EditorNavigation.SelectEntityByName("ParentPage1", EntityType.Page);
    PageLeftPane.assertAbsence("ChildPage1");
    PageLeftPane.expandCollapseItem("Queries/JS");
    PageLeftPane.assertAbsence("ChildApi1");
    PageLeftPane.assertAbsence("ChildJSAction1");
  });

  // rename entities
  it("3. makes branch specific resource updates", function () {
    cy.switchGitBranch(childBranchKey);
    EditorNavigation.SelectEntityByName("ParentPage1", EntityType.Page);
    entityExplorer.RenameEntityFromExplorer(
      "ParentPage1",
      "ParentPageRenamed",
      true,
    );
    agHelper.RemoveUIElement("Tooltip", "Add a new query/JS Object");
    PageLeftPane.expandCollapseItem("Queries/JS");
    entityExplorer.RenameEntityFromExplorer("ParentApi1", "ParentApiRenamed");

    cy.switchGitBranch(parentBranchKey);

    PageLeftPane.expandCollapseItem("Pages");
    PageLeftPane.assertAbsence("ParentPageRenamed");
    PageLeftPane.expandCollapseItem("Queries/JS");
    PageLeftPane.assertAbsence("ParentApiRenamed");
  });

  it("4. enables switching branch from the URL", () => {
    cy.url().then((url) => {
      EditorNavigation.SelectEntityByName("ParentPage1", EntityType.Page);
      cy.get(explorer.addWidget).click();
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
      cy.get(".t--widget-tablewidgetv2").should("exist");
      cy.commitAndPush();

      const urlObject = new URL(url);
      urlObject.searchParams.set(branchQueryKey, childBranchKey);
      cy.visit(urlObject.toString(), { timeout: 60000 });

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
        cy.visit(urlObject.toString(), { timeout: 60000 });

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
    deployMode.NavigateBacktoEditor();
    gitSync.CreateGitBranch(tempBranch, true);
    cy.get("@gitbranchName").then((branName) => {
      tempBranch = branName;
    });
    gitSync.CreateGitBranch(`${tempBranch}-1`, true);
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
    deployMode.NavigateBacktoEditor(); //Adding since skipping 6th case
    cy.generateUUID().then((uuid) => {
      gitSync.CreateGitBranch(childBranchKey, true);
      //cy.createGitBranch(childBranchKey);
      cy.CheckAndUnfoldEntityItem("Pages");
      PageList.AddNewPage();
      cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.get(gitSyncLocators.branchSearchInput).type("{selectall}master");
      cy.wait(400);
      cy.get(gitSyncLocators.branchListItem).contains("master").click();
      cy.wait(4000);
      PageLeftPane.switchSegment(PagePaneSegment.Widgets);
      cy.get(`.t--entity.page`)
        .contains("Page1")
        .closest(".t--entity")
        .should("be.visible")
        .should("have.class", "activePage");
      cy.get(".t--canvas-artboard").should("be.visible");
    });
    agHelper.RefreshPage();
  });

  it("7. branch list search", function () {
    cy.get(".ads-v2-spinner").should("not.exist");
    PageLeftPane.switchSegment(PagePaneSegment.Widgets);
    cy.get(commonLocators.canvas).click({ force: true });
    let parentBKey, childBKey;
    gitSync.CreateGitBranch("parentBranch", true);
    cy.get("@gitbranchName").then((branName) => {
      parentBKey = branName;

      gitSync.CreateGitBranch("childBranch", true);
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
    gitSync.DeleteTestGithubRepo(repoName);
  });
});
