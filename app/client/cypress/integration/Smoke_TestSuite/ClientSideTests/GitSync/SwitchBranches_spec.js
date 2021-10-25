const pages = require("../../../../locators/Pages.json");
const jsActions = require("../../../../locators/jsActionLocators.json");
const commonLocators = require("../../../../locators/commonlocators.json");
const commentsLocators = require("../../../../locators/commentsLocators.json");
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import homePage from "../../../../locators/HomePage";
const { typeIntoDraftEditor } = require("../Comments/utils");

const GITHUB_API_BASE = "https://api.github.com";

let generatedKey;

const testEmail = "test@test.com";
const testUsername = "testusername";
const newCommentText1 = "new comment text 1";

describe("Git sync connect to repo", function() {
  // create a new repo
  before(() => {
    cy.request({
      method: "POST",
      url: `${GITHUB_API_BASE}/user/repos`,
      headers: {
        Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
      },
      body: {
        name: Cypress.env("GITSYNC_TEST_REPO_NAME"),
      },
    });
  });

  it("connects successfully", function() {
    // // open gitSync modal
    cy.get(homePage.deployPopupOptionTrigger).click();
    cy.get(homePage.connectToGitBtn).click();

    // todo: check for the initial state: init git connection button, regular deploy button
    // add the test repo and click on submit btn
    // intercept just the connect api

    cy.intercept(
      {
        url: "api/v1/git/commit/*",
        hostname: window.location.host,
      },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );
    cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
      "generateKey",
    );
    cy.get(gitSyncLocators.gitRepoInput).type(
      Cypress.env("GITSYNC_TEST_REPO_URL"),
    );
    cy.get(gitSyncLocators.generateDeployKeyBtn).click();
    cy.wait("@generateKey").then((result) => {
      generatedKey = result.response.body.data.publicKey;
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `${GITHUB_API_BASE}/repos/${Cypress.env(
          "TEST_GITHUB_USER_NAME",
        )}/${Cypress.env("GITSYNC_TEST_REPO_NAME")}/keys`,
        headers: {
          Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
        },
        body: {
          title: "key0",
          key: generatedKey,
        },
      });
      cy.get(gitSyncLocators.gitConfigNameInput).type(
        `{selectall}${testUsername}`,
      );
      cy.get(gitSyncLocators.gitConfigEmailInput).type(
        `{selectall}${testEmail}`,
      );
      // click on the connect button and verify
      cy.get(gitSyncLocators.connectSubmitBtn).click();

      // check for connect success
      cy.wait("@connectGitRepo").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // click commit button
      cy.get(gitSyncLocators.commitButton).click();
      // check for commit success
      cy.wait("@commit").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get("body").type("{esc}");
    });
  });

  it("creates a new branch", function() {
    // cy.get(commonlocators.canvas).click();
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLocators.createNewBranchButton).click();
    // cy.get(gitSyncLocators.createNewBranchSubmitbutton).click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
  });

  it("creates branch specific resources", function() {
    // cy.Createpage("ParentPage1");
    // cy.get(pages.addEntityAPI)
    //   .last()
    //   .should("be.visible")
    //   .click({ force: true });
    // cy.get(pages.integrationCreateNew)
    //   .should("be.visible")
    //   .click({ force: true });
    // cy.CreateAPI("ParentApi1");
    // cy.get(jsActions.addJsActionButton)
    //   .last()
    //   .click({ force: true });
    // cy.wait("@createNewJSCollection");
    // cy.get(jsActions.name).click({ force: true });
    // cy.get(jsActions.nameInput)
    //   .type("{selectall}ParentJsAction1", { force: true })
    //   .should("have.value", "ParentJsAction1")
    //   .blur();
    // cy.wait("@renameJsAction");
    // // Added because api name edit takes some time to
    // // reflect in api sidebar after the call passes.
    // // eslint-disable-next-line cypress/no-unnecessary-waiting
    // cy.wait(2000);
    // // cy.get(commonlocators.canvas).click();
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("ChildBranch");
    // cy.get(gitSyncLocators.createNewBranchButton).click();
    // cy.get(gitSyncLocators.createNewBranchSubmitbutton).click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
    // cy.Createpage("ChildPage1");
    // cy.get(pages.addEntityAPI)
    //   .last()
    //   .should("be.visible")
    //   .click({ force: true });
    // cy.get(pages.integrationCreateNew)
    //   .should("be.visible")
    //   .click({ force: true });
    // cy.CreateAPI("ChildApi1");
    // cy.get(jsActions.addJsActionButton)
    //   .last()
    //   .click({ force: true });
    // cy.wait("@createNewJSCollection");
    // cy.get(jsActions.name).click({ force: true });
    // cy.get(jsActions.nameInput)
    //   .type("{selectall}ChildJsAction1", { force: true })
    //   .should("have.value", "ChildJsAction1")
    //   .blur();
    // cy.wait("@renameJsAction");
    // // Added because api name edit takes some time to
    // // reflect in api sidebar after the call passes.
    // // eslint-disable-next-line cypress/no-unnecessary-waiting
    // cy.wait(2000);
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLocators.branchListItem)
    //   .contains("ParentBranch")
    //   .click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // test comments across branches
  it("has branch specific comments", function() {
    // signing up with a new user for a predictable behaviour,so that even if the comments spec
    // is run along with this spec the onboarding is always triggered
    // cy.generateUUID().then((uid) => {
    //   cy.Signup(`${uid}@appsmith.com`, uid);
    // });
    // cy.NavigateToHome();
    // cy.createOrg();
    // cy.wait("@createOrg").then((interception) => {
    //   const newOrganizationName = interception.response.body.data.name;
    //   cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    // });
    // cy.skipCommentsOnboarding();
    // wait for comment mode to be set
    // cy.wait(1000);
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("ChildBranch");
    // cy.get(gitSyncLocators.branchListItem)
    //   .contains("ChildBranch")
    //   .click();
    // cy.get(commentsLocators.switchToCommentModeBtn).click({ force: true });
    // cy.get(newCommentText1).should("not.exist");
  });

  // rename entities
  it("makes branch specific resource updates", function() {
    // WIP
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("{selectall}ChildBranch");
    // cy.get(gitSyncLocators.branchListItem)
    //   .contains("ChildBranch")
    //   .click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
    // cy.GlobalSearchEntity("ParentPage1");
    // cy.RenameEntity("ParentPageRenamed");
    // cy.GlobalSearchEntity("ParentApi1");
    // cy.RenameEntity("ParentApiRenamed");
    // cy.GlobalSearchEntity("ChildJsAction1");
    // cy.RenameEntity("ParentJsActionRenamed");
    // cy.get(gitSyncLocators.branchButton).click();
    // cy.get(gitSyncLocators.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLocators.branchListItem)
    //   .contains("ParentBranch")
    //   .click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentPageRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentApiRenamed")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ParentJsActionRenamed")`).should(
    //   "not.exist",
    // );
  });

  // delete the created repo
  after(() => {
    cy.request({
      method: "DELETE",
      url: `${GITHUB_API_BASE}/repos/${Cypress.env(
        "TEST_GITHUB_USER_NAME",
      )}/${Cypress.env("GITSYNC_TEST_REPO_NAME")}`,
      headers: {
        Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
      },
    });
  });
});
