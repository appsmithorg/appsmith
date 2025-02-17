import commonLocators from "../../../../../locators/commonlocators.json";

import {
  agHelper,
  entityExplorer,
  jsEditor,
  deployMode,
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
import { EntityItems } from "../../../../../support/Pages/AssertHelper";

let parentBranchKey = "ParentBranch",
  childBranchKey = "ChildBranch",
  branchQueryKey = "branch";

let repoName;
describe(
  "Git sync:",
  {
    tags: [
      "@tag.Git",
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
  function () {
    before(() => {
      gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });

    it("1. create branch input", function () {
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(gitSync.locators.quickActionsBranchBtn).click();

      // validate of the branch name
      const hypenBranchName = "hypen-branch-name";
      cy.get(gitSync.locators.branchSearchInput).type(
        `{selectall}${hypenBranchName}`,
      );
      agHelper.AssertAttribute(
        gitSync.locators.branchSearchInput,
        "value",
        "hypen-branch-name",
      );
      const specialBranchName = "special&branch-name~@#$%^&*()_+={}[]><,.";
      cy.get(gitSync.locators.branchSearchInput).type(
        `{selectall}${specialBranchName}`,
      );
      agHelper.AssertAttribute(
        gitSync.locators.branchSearchInput,
        "value",
        "special_branch-name_____________________",
      );
      cy.get(gitSync.locators.branchCloseBtn).click();
    });

    it("2. creates a new branch and create branch specific resources", function () {
      cy.get(commonLocators.canvas).click({ force: true });
      //cy.createGitBranch(parentBranchKey);
      gitSync.CreateGitBranch(parentBranchKey, true);
      cy.get("@gitbranchName").then((branName) => {
        parentBranchKey = branName;
      });

      PageList.AddNewPage();
      entityExplorer.RenameEntityFromExplorer(
        "Page2",
        "ParentPage1",
        false,
        EntityItems.Page,
      );
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
      entityExplorer.RenameEntityFromExplorer(
        "Page2",
        "ChildPage1",
        false,
        EntityItems.Page,
      );
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
      PageList.VerifyIsCurrentPage("Page1");

      EditorNavigation.SelectEntityByName("ParentPage1", EntityType.Page);
      PageList.assertAbsence("ChildPage1");
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.assertAbsence("ChildApi1");
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.assertAbsence("ChildJSAction1");
    });

    // rename entities
    it("3. makes branch specific resource updates", function () {
      gitSync.SwitchGitBranch(childBranchKey);
      EditorNavigation.NavigateToPage("ParentPage1", true);
      entityExplorer.RenameEntityFromExplorer(
        "ParentPage1",
        "ParentPageRenamed",
        false,
        EntityItems.Page,
      );
      agHelper.RemoveUIElement(
        "Tooltip",
        Cypress.env("MESSAGES").ADD_QUERY_JS_TOOLTIP(),
      );
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.RenameEntityFromExplorer("ParentApi1", "ParentApiRenamed");

      gitSync.SwitchGitBranch(parentBranchKey);
      PageList.assertAbsence("ParentPageRenamed");
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.assertAbsence("ParentApiRenamed");
    });

    it("4. enables switching branch from the URL", () => {
      cy.url().then((url) => {
        EditorNavigation.SelectEntityByName("ParentPage1", EntityType.Page);
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

          cy.wait("@getConsolidatedData").should(
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
      // rename branch API missing in TED.
      // cy.renameBranchViaGithubApi(repoName, tempBranch, tempBranchRenamed);
      cy.get(gitSync.locators.quickActionsBranchBtn).click();
      cy.get(gitSync.locators.branchSearchInput).type(
        `{selectall}${tempBranch}`,
      );
      const tempBranchRegex = new RegExp(`^${tempBranch}$`);
      const tempBranchRenamedRegex = new RegExp(`^${tempBranchRenamed}$`);
      const remoteTempBranchRenamedRegex = new RegExp(
        `^origin/${tempBranchRenamed}$`,
      );
      cy.get(gitSync.locators.branchItem).contains(tempBranchRegex);
      cy.get(gitSync.locators.branchSyncBtn).click();
      cy.get(gitSync.locators.branchItem)
        .contains(tempBranchRegex)
        .should("exist");
      cy.get(gitSync.locators.branchItem)
        .contains(remoteTempBranchRenamedRegex)
        .should("exist");
      cy.get(gitSync.locators.branchCloseBtn).click();
      cy.switchGitBranch(`origin/${tempBranchRenamed}`);
      cy.switchGitBranch(`origin/${tempBranchRenamed}`, true);
      cy.wait(4000); // wait for switch branch
      // assert error toast
      cy.contains(`origin/${tempBranchRenamed} already exists`);
      cy.get(gitSync.locators.branchCloseBtn).click();
    });

    // Validate the error faced when user switches between the branches
    it("6. no error faced when user switches branch with new page", function () {
      deployMode.NavigateBacktoEditor(); //Adding since skipping 6th case
      cy.generateUUID().then((uuid) => {
        gitSync.CreateGitBranch(childBranchKey, true);
        //cy.createGitBranch(childBranchKey);
        PageList.AddNewPage();
        cy.get(gitSync.locators.quickActionsBranchBtn).click({ force: true });
        cy.get(gitSync.locators.branchSearchInput).type("{selectall}master");
        cy.wait(400);
        cy.get(gitSync.locators.branchItem).contains("master").click();
        cy.wait(4000);
        PageLeftPane.switchSegment(PagePaneSegment.UI);
        PageList.VerifyIsCurrentPage("Page1");
        cy.get(".t--canvas-artboard").should("be.visible");
      });
      agHelper.RefreshPage();
    });

    it("7. branch list search", function () {
      cy.get(".ads-v2-spinner").should("not.exist");
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(commonLocators.canvas).click({ force: true });
      let parentBKey, childBKey;
      gitSync.CreateGitBranch("parentBranch", true);
      cy.get("@gitbranchName").then((branName) => {
        parentBKey = branName;

        gitSync.CreateGitBranch("childBranch", true);
        cy.get("@gitbranchName").then((branName) => {
          childBKey = branName;

          cy.get(gitSync.locators.quickActionsBranchBtn).click();
          cy.get(gitSync.locators.branchSearchInput).type(
            `{selectall}${parentBKey.slice(0, 3)}`,
          );
          cy.get(gitSync.locators.branchItem).contains(parentBKey);

          cy.get(gitSync.locators.branchSearchInput).type(
            `{selectall}${childBKey.slice(0, 3)}`,
          );
          cy.get(gitSync.locators.branchItem).contains(childBKey);

          cy.get(gitSync.locators.branchSearchInput).type(
            `{selectall}${branchQueryKey}`,
          );
          cy.get(gitSync.locators.branchItem).contains(childBKey);
          cy.get(gitSync.locators.branchItem).contains(parentBKey);

          cy.get(gitSync.locators.branchSearchInput).type(`{selectall}abcde`);
          cy.get(gitSync.locators.branchItem).should("not.exist");

          cy.get(gitSync.locators.branchSearchInput).clear();
          cy.get(gitSync.locators.branchItem).contains(childBKey);
          cy.get(gitSync.locators.branchItem).contains(parentBKey);
        });
      });
      cy.get(gitSync.locators.branchCloseBtn).click();
    });

    after(() => {
      gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
