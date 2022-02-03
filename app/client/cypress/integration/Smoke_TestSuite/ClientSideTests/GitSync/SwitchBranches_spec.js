const gitSyncLoctors = require("../../../../locators/gitSyncLocators.json");
const homePage = require("../../../../locators/HomePage.json");
const pages = require("../../../../locators/Pages.json");
const jsActions = require("../../../../locators/jsActionLocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");

const GITHUB_API_BASE = "https://api.github.com";

let generatedKey;

const testEmail = "test@test.com";
const testUsername = "testusername";

describe("Git sync connect to repo", function() {
  // create a new repo
  // before(() => {
  //   cy.request({
  //     method: "POST",
  //     url: `${GITHUB_API_BASE}/user/repos`,
  //     headers: {
  //       Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
  //     },
  //     body: {
  //       name: Cypress.env("GITSYNC_TEST_REPO_NAME"),
  //     },
  //   });
  // });

  it("connects successfully", function() {
    // cy.get(homePage.publishButton).click();
    // // todo: check for the initial state: init git connection button, regular deploy button
    // // add the test repo and click on submit btn
    // intercept just the connect api
    // cy.intercept(
    //   {
    //     url: "*",
    //     hostname: window.location.host,
    //   },
    //   (req) => {
    //     req.headers["origin"] = "Cypress";
    //   },
    // );
    // cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
    //   "generateKey",
    // );
    // cy.get(gitSyncLoctors.gitRepoInput).type(
    //   Cypress.env("GITSYNC_TEST_REPO_URL"),
    // );
    // cy.get(gitSyncLoctors.submitRepoUrlButton).click();
    // cy.wait("@generateKey").then((result) => {
    //   generatedKey = result.response.body.data.publicKey;
    //   generatedKey = generatedKey.slice(0, generatedKey.length - 1);
    //   // fetch the generated key and post to the github repo
    //   cy.request({
    //     method: "POST",
    //     url: `${GITHUB_API_BASE}/repos/${Cypress.env(
    //       "TEST_GITHUB_USER_NAME",
    //     )}/${Cypress.env("GITSYNC_TEST_REPO_NAME")}/keys`,
    //     headers: {
    //       Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
    //     },
    //     body: {
    //       title: "key0",
    //       key: generatedKey,
    //     },
    //   });
    //   // click on the connect button and verify
    //   cy.get(gitSyncLoctors.gitConfigNameInput).type(
    //     `{selectall}${testUsername}`,
    //   );
    //   cy.get(gitSyncLoctors.gitConfigEmailInput).type(
    //     `{selectall}${testEmail}`,
    //   );
    //   cy.get(gitSyncLoctors.connectSubmitBtn).click();
    //   cy.wait("@connectGitRepo");
    //   cy.get(gitSyncLoctors.commitButton).click();
    //   cy.wait("@commit");
    //   cy.get("body").type("{esc}");
    // });
  });

  it("creates a new branch", function() {
    // cy.get(commonlocators.canvas).click();
    // cy.get(gitSyncLoctors.branchButton).click();
    // cy.get(gitSyncLoctors.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLoctors.createNewBranchButton).click();
    // cy.get(gitSyncLoctors.createNewBranchSubmitbutton).click();
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
    // cy.get(gitSyncLoctors.branchButton).click();
    // cy.get(gitSyncLoctors.branchSearchInput).type("ChildBranch");
    // cy.get(gitSyncLoctors.createNewBranchButton).click();
    // cy.get(gitSyncLoctors.createNewBranchSubmitbutton).click();
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
    // cy.get(gitSyncLoctors.branchButton).click();
    // cy.get(gitSyncLoctors.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLoctors.branchListItem)
    //   .contains("ParentBranch")
    //   .click();
    // cy.get(".bp3-spinner").should("exist");
    // cy.get(".bp3-spinner").should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildPage1")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildApi1")`).should("not.exist");
    // cy.get(`.t--entity-name:contains("ChildJsAction1")`).should("not.exist");
  });

  // rename entities
  it("makes branch specific resource updates", function() {
    // WIP
    // cy.get(gitSyncLoctors.branchButton).click();
    // cy.get(gitSyncLoctors.branchSearchInput).type("{selectall}ChildBranch");
    // cy.get(gitSyncLoctors.branchListItem)
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
    // cy.get(gitSyncLoctors.branchButton).click();
    // cy.get(gitSyncLoctors.branchSearchInput).type("ParentBranch");
    // cy.get(gitSyncLoctors.branchListItem)
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
  // after(() => {
  //   cy.request({
  //     method: "DELETE",
  //     url: `${GITHUB_API_BASE}/repos/${Cypress.env(
  //       "TEST_GITHUB_USER_NAME",
  //     )}/${Cypress.env("GITSYNC_TEST_REPO_NAME")}`,
  //     headers: {
  //       Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
  //     },
  //   });
  // });
});
