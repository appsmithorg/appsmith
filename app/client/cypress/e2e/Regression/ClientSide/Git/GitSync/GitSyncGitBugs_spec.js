import gitSyncLocators from "../../../../../locators/gitSyncLocators";
const commonlocators = require("../../../../../locators/commonlocators.json");
import homePageLocators from "../../../../../locators/HomePage";
import {
  agHelper,
  entityExplorer,
  dataManager,
  gitSync,
  homePage,
  jsEditor,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";
import { EntityItems } from "../../../../../support/Pages/AssertHelper";

const pagename = "ChildPage";
const tempBranch = "feat/tempBranch";
const tempBranch0 = "tempBranch0";
const mainBranch = "master";
const jsObject = "JSObject1";
let repoName;

describe(
  "Git sync Bug #10773",
  { tags: ["@tag.Git", "@tag.Sanity", "@tag.AccessControl", "@tag.Workflows", "@tag.Module", "@tag.Theme", "@tag.JS", "@tag.Container", "@tag.ImportExport"] },
  function () {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Bug:10773 When user delete a resource form the child branch and merge it back to parent branch, still the deleted resource will show up in the newly created branch", () => {
      homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, "app-1");
        gitSync.CreateNConnectToGit();
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;
          // adding a new page "ChildPage" to master
          cy.Createpage(pagename);
          EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
          cy.commitAndPush();
          cy.wait(2000);
          gitSync.CreateGitBranch(tempBranch, false);
          //cy.createGitBranch(tempBranch);
          // verify tempBranch should contain this page
          EditorNavigation.SelectEntityByName(pagename, EntityType.Page);
          // delete page from tempBranch and merge to master
          PageList.DeletePage(pagename);
          cy.get(homePageLocators.publishButton).click();
          cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
          cy.get(gitSyncLocators.commitButton).click();
          cy.wait(8000);
          cy.get(gitSyncLocators.closeGitSyncModal).click();
          cy.merge(mainBranch);
          cy.get(gitSyncLocators.closeGitSyncModal).click();
          // verify ChildPage is not on master
          cy.switchGitBranch(mainBranch);
          PageList.ShowList();
          PageLeftPane.assertAbsence(pagename);
          // create another branch and verify deleted page doesn't exist on it
          //cy.createGitBranch(tempBranch0);
          gitSync.CreateGitBranch(tempBranch0, false);
          PageList.ShowList();
          PageLeftPane.assertAbsence(pagename);
          gitSync.DeleteTestGithubRepo(repoName);
        });
      });
    });

    it("2. Connect app to git, clone the Page ,verify JSobject duplication should not happen and validate data binding in deploy mode and edit mode", () => {
      homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, "app-2");
        agHelper.AddDsl("JsObjecWithGitdsl");
        // connect app to git
        gitSync.CreateNConnectToGit();
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;

          // create JS Object and validate its data on Page1
          jsEditor.CreateJSObject('return "Success";');
          EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
          cy.wait(1000);
          EditorNavigation.ShowCanvas();
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
          // clone the page1 and validate data binding
          entityExplorer.ActionContextMenuByEntityName({
            entityNameinLeftSidebar: "Page1",
            action: "Clone",
            entityType: EntityItems.Page,
          });
          cy.wait("@clonePage").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
          );
          PageLeftPane.switchSegment(PagePaneSegment.JS);
          // verify jsObject is not duplicated
          PageLeftPane.assertPresence(jsObject);
          EditorNavigation.ShowCanvas();
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
          // deploy the app and validate data binding
          cy.get(homePageLocators.publishButton).click();
          agHelper.AssertElementExist(gitSync._bottomBarPull);
          cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
          cy.get(gitSyncLocators.commitButton).click();
          cy.wait(8000);
          cy.get(gitSyncLocators.closeGitSyncModal).click();
          cy.latestDeployPreview();
          cy.wait(2000);
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
          // switch to Page1 and validate data binding
          cy.get(".t--page-switch-tab")
            .contains("Page1")
            .click({ force: true });
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
          deployMode.NavigateBacktoEditor();
        });
      });
    });

    it("3. Bug:12724 Js objects are merged to single page when user creates a new branch", () => {
      // create a new branch, clone page and validate jsObject data binding
      //cy.createGitBranch(tempBranch);
      cy.wait(3000);

      gitSync.CreateGitBranch(tempBranch, true);
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      // verify jsObject is not duplicated
      PageLeftPane.assertPresence(jsObject);
      EditorNavigation.ShowCanvas();
      cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
        "be.visible",
      );
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Clone",
        entityType: EntityItems.Page,
      });
      cy.wait("@clonePage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      gitSync.DeleteTestGithubRepo(repoName);
    });

    it("4. Create an app with JSObject, connect it to git and verify its data in edit and deploy mode", function () {
      homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
        agHelper.AddDsl("JsObjecWithGitdsl");
      });
      // create JS Object and validate its data on Page1
      jsEditor.CreateJSObject('return "Success";');
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.wait(1000);
      EditorNavigation.ShowCanvas();
      cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
        "be.visible",
      );
      // clone the page1 and validate data binding
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page1",
        action: "Clone",
        entityType: EntityItems.Page,
      });
      cy.wait("@clonePage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      // connect app to git and deploy
      gitSync.CreateNConnectToGit();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
        cy.wait(2000);

        cy.window()
          .its("store")
          .invoke("getState")
          .then((state) => {
            const commitInputDisabled =
              state.ui.gitSync.gitStatus?.isClean ||
              state.ui.gitSync.isCommitting;

            if (!commitInputDisabled) {
              cy.commitAndPush();
            }

            // check last deploy preview
            if (state.ui.applications.currentApplication?.lastDeployedAt) {
              cy.latestDeployPreview();
              cy.wait(1000);
              cy.xpath(
                "//input[@class='bp3-input' and @value='Success']",
              ).should("be.visible");
              // switch to Page1 and validate data binding
              cy.get(".t--page-switch-tab")
                .contains("Page1")
                .click({ force: true });
              cy.xpath(
                "//input[@class='bp3-input' and @value='Success']",
              ).should("be.visible");
              cy.get(commonlocators.backToEditor).click();
            } else if (state.ui.gitSync.isGitSyncModalOpen) {
              cy.get(gitSyncLocators.closeGitSyncModal).click({ force: true });
            }

            // verify jsObject data binding on Page 1
            PageLeftPane.switchSegment(PagePaneSegment.JS);
            PageLeftPane.assertPresence(jsObject);
            EditorNavigation.ShowCanvas();
            cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
              "be.visible",
            );
            // switch to Page1 copy and verify jsObject data binding
            EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
            PageLeftPane.switchSegment(PagePaneSegment.JS);
            // verify jsObject is not duplicated
            PageLeftPane.assertPresence(jsObject);
            EditorNavigation.ShowCanvas();
            cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
              "be.visible",
            );
          });
        gitSync.DeleteTestGithubRepo(repoName);
      });
    });

    it("5. Bug:13385 : Unable to see application in home page after the git connect flow is aborted in middle", () => {
      homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, `${newWorkspaceName}app`);

        cy.generateUUID().then((uid) => {
          repoName = uid;
          gitSync.CreateTestGiteaRepo(repoName);
          gitSync.OpenGitSyncModal();

          agHelper.GetNClick(gitSync.providerRadioOthers);
          agHelper.GetNClick(gitSync.existingEmptyRepoYes);
          agHelper.GetNClick(gitSync.gitConnectNextBtn);
          agHelper.TypeText(
            gitSync.remoteUrlInput,
            `${dataManager.GIT_CLONE_URL}/${repoName}.git`,
          );
          agHelper.GetNClick(gitSync.gitConnectNextBtn);

          // abort git flow after generating key
          cy.get(gitSyncLocators.closeGitSyncModal).click();
        });
        // verify app is visible and open
        homePage.NavigateToHome();
        cy.reload();
        cy.wait(3000);
        cy.SearchApp(`${newWorkspaceName}app`);
      });
    });
  },
);
