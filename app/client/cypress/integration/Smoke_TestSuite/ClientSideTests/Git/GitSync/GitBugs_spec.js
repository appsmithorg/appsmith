import gitSyncLocators from "../../../../../locators/gitSyncLocators";
const dsl = require("../../../../../fixtures/JsObjecWithGitdsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const pages = require("../../../../../locators/Pages.json");
import homePage from "../../../../../locators/HomePage";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;
const pagename = "ChildPage";
const tempBranch = "feat/tempBranch";
const tempBranch0 = "tempBranch0";
const mainBranch = "master";
const jsObject = "JSObject1";
let repoName;

describe("Git sync Bug #10773", function() {
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

  it("Bug:10773 When user delete a resource form the child branch and merge it back to parent branch, still the deleted resource will show up in the newly created branch", () => {
    // adding a new page "ChildPage" to master
    cy.Createpage(pagename);
    cy.get(".t--entity-name:contains('Page1')").click();
    cy.commitAndPush();
    cy.wait(2000);
    cy.createGitBranch(tempBranch);
    cy.CheckAndUnfoldEntityItem("PAGES");
    // verify tempBranch should contain this page
    cy.get(`.t--entity-name:contains("${pagename}")`).should("be.visible");
    cy.get(`.t--entity-name:contains("${pagename}")`).click();
    // delete page from tempBranch and merge to master
    cy.Deletepage(pagename);
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    // verify ChildPage is not on master
    cy.switchGitBranch(mainBranch);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${pagename}")`).should("not.exist");
    // create another branch and verify deleted page doesn't exist on it
    cy.createGitBranch(tempBranch0);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${pagename}")`).should("not.exist");
  });
});

describe("Git Bug: Fix clone page issue where JSObject are not showing up in destination page when application is connected to git", function() {
  it("Connect app to git, clone the Page ,verify JSobject duplication should not happen and validate data binding in deploy mode and edit mode", () => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      cy.addDsl(dsl);
    });
    // connect app to git
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // create JS object and validate its data on Page1
    cy.createJSObject('return "Success";');
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(1000);
    cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
      "be.visible",
    );
    // clone the page1 and validate data binding
    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.xpath(apiwidget.popover)
      .first()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.get(pages.clonePage).click({ force: true });
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify jsObject is not duplicated
    cy.get(`.t--entity-name:contains(${jsObject})`).should("have.length", 1);
    cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
      "be.visible",
    );
    // deploy the app and validate data binding
    cy.get(homePage.publishButton).click();
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
    cy.get(commonlocators.backToEditor).click();
    cy.wait(1000);
  });

  it("Bug:12724 Js objects are merged to single page when user creates a new branch", () => {
    // create a new branch, clone page and validate jsObject data binding
    cy.createGitBranch(tempBranch);
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(".t--entity-name:contains(Page1)")
      .last()
      .trigger("mouseover")
      .click({ force: true });
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    // verify jsObject is not duplicated
    cy.get(`.t--entity-name:contains(${jsObject})`).should("have.length", 1);
    cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
      "be.visible",
    );
    cy.get(".t--entity-name:contains(Page1)")
      .first()
      .trigger("mouseover")
      .click({ force: true });
    cy.xpath(apiwidget.popover)
      .first()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.get(pages.clonePage).click({ force: true });
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
describe("Git synced app with JSObject", function() {
  it("Create an app with JSObject, connect it to git and verify its data in edit and deploy mode", function() {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      cy.addDsl(dsl);
    });
    ee.ExpandCollapseEntity("QUERIES/JS", true);
    // create JS object and validate its data on Page1
    cy.createJSObject('return "Success";');
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(1000);
    cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
      "be.visible",
    );
    // clone the page1 and validate data binding
    cy.get(".t--entity-name:contains(Page1)")
      .trigger("mouseover")
      .click({ force: true });
    cy.xpath(apiwidget.popover)
      .first()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.get(pages.clonePage).click({ force: true });
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    // connect app to git and deploy
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
      cy.wait(3000);

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
            cy.get(commonlocators.backToEditor).click();
          } else if (state.ui.gitSync.isGitSyncModalOpen) {
            cy.get(gitSyncLocators.closeGitSyncModal).click({ force: true });
          }

          // verify jsObject data binding on Page 1
          cy.CheckAndUnfoldEntityItem("QUERIES/JS");
          cy.get(`.t--entity-name:contains(${jsObject})`).should(
            "have.length",
            1,
          );
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
          // switch to Page1 copy and verify jsObject data binding
          cy.CheckAndUnfoldEntityItem("PAGES");
          cy.get(".t--entity-name:contains(Page1)")
            .last()
            .trigger("mouseover")
            .click({ force: true });
          cy.CheckAndUnfoldEntityItem("QUERIES/JS");
          // verify jsObject is not duplicated
          cy.get(`.t--entity-name:contains(${jsObject})`).should(
            "have.length",
            1,
          );
          cy.xpath("//input[@class='bp3-input' and @value='Success']").should(
            "be.visible",
          );
        });
    });
  });
  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
describe("Git sync Bug #13385", function() {
  it("Bug:13385 : Unable to see application in home page after the git connect flow is aborted in middle", () => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, `${newWorkspaceName}app`);

      cy.generateUUID().then((uid) => {
        const owner = Cypress.env("TEST_GITHUB_USER_NAME");
        repoName = uid;
        cy.createTestGithubRepo(repoName);

        // open gitSync modal
        cy.get(homePage.deployPopupOptionTrigger).click();
        cy.get(homePage.connectToGitBtn).click({ force: true });

        cy.intercept(
          {
            url: "api/v1/git/connect/*",
            hostname: window.location.host,
          },
          (req) => {
            req.headers["origin"] = "Cypress";
          },
        );
        cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
          `generateKey-${repoName}`,
        );
        cy.get(gitSyncLocators.gitRepoInput).type(
          `git@github.com:${owner}/${repoName}.git`,
        );
        // abort git flow after generating key
        cy.get(gitSyncLocators.closeGitSyncModal).click();
      });
      // verify app is visible and open
      cy.NavigateToHome();
      cy.reload();
      cy.wait(3000);
      cy.SearchApp(`${newWorkspaceName}app`);
    });
  });
});
