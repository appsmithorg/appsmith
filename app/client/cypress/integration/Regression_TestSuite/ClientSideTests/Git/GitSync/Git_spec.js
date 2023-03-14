const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const explorerLocators = require("../../../../../locators/explorerlocators.json");
import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

let tempBranch = "tempBranch",
  tempBranch0 = "tempBranch0",
  tempBranch1 = "tempBranch1",
  tempBranch2 = "tempBranch2",
  tempBranch3 = "tempBranch3";

const buttonNameMainBranch = "buttonMainBranch";
const buttonNameMainBranchEdited = "buttonMainBranchEdited";
const buttonNameTemp0Branch = "buttonTemp0Branch";
const buttonNameTempBranch1 = "buttonTempBranch1";
const mainBranch = "master";

const inputNameTempBranch3 = "inputNameTempBranch3";
const inputNameTempBranch31 = "inputNameTempBranch31";

const cleanUrlBranch = "feat/clean_url";

let applicationId = null;
let applicationName = null;

let repoName;
describe.skip("Git sync:", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.generateUUID().then((uid) => {
        cy.CreateAppForWorkspace(newWorkspaceName, uid);
        applicationName = uid;
        cy.get("@currentApplicationId").then(
          (currentAppId) => (applicationId = currentAppId),
        );
      });
    });

    // cy.generateUUID().then((uid) => {
    //   repoName = uid;
    _.gitSync.CreateNConnectToGit(repoName);
    // cy.createTestGithubRepo(repoName);
    // cy.connectToGitRepo(repoName);
    //});
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
  });

  it("1. Shows remote is ahead warning and conflict error during commit and push", function() {
    _.gitSync.CreateGitBranch(tempBranch, false);
    cy.get("@gitbranchName").then((branName) => {
      tempBranch = branName;
      cy.log("tempBranch is " + tempBranch);

      //cy.createGitBranch(tempBranch);
      cy.get(explorerLocators.widgetSwitchId).click();
      cy.wait(2000); // wait for transition
      cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
      // cy.createGitBranch(tempBranch0);
      _.gitSync.CreateGitBranch(tempBranch0, false);
      cy.get("@gitbranchName").then((branName) => {
        tempBranch0 = branName;
        cy.log("tempBranch0 is " + tempBranch0);
        cy.widgetText(
          buttonNameTemp0Branch,
          widgetsPage.buttonWidget,
          widgetsPage.widgetNameSpan,
        );
        cy.commitAndPush();
        cy.switchGitBranch(tempBranch);
        cy.merge(tempBranch0);
      });

      // cy.mergeViaGithubApi({
      //   repo: repoName,
      //   base: tempBranch,
      //   head: tempBranch0,
      // });
      cy.switchGitBranch(tempBranch);
    });
    cy.widgetText(
      buttonNameMainBranch,
      widgetsPage.buttonWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait("@commit").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      400,
    );

    cy.contains(Cypress.env("MESSAGES").GIT_UPSTREAM_CHANGES());
    cy.get(gitSyncLocators.pullButton).click();
    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("2. Detect conflicts when merging head to base branch", function() {
    cy.switchGitBranch(mainBranch);
    cy.get(explorerLocators.widgetSwitchId).click();
    cy.wait(2000); // wait for transition
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    _.gitSync.CreateGitBranch(tempBranch1, false);
    cy.widgetText(
      buttonNameTempBranch1,
      widgetsPage.buttonWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.commitAndPush();

    cy.switchGitBranch(mainBranch);
    cy.widgetText(
      buttonNameMainBranchEdited,
      widgetsPage.buttonWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.commitAndPush();

    cy.switchGitBranch(tempBranch1);

    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.wait(5000); // wait for git status call to finish
    cy.get(gitSyncLocators.mergeBranchDropdownDestination).click();
    cy.get(commonlocators.dropdownmenu)
      .contains(mainBranch)
      .click();
    // assert conflicting status
    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("3. Supports merging head to base branch", function() {
    cy.switchGitBranch(mainBranch);
    cy.createGitBranch(tempBranch2);
    cy.get(explorerLocators.explorerSwitchId).click({ force: true });
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("NewPage");
    cy.commitAndPush();
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(8000);
    cy.switchGitBranch(mainBranch);
    cy.wait(4000); // wait for switch branch
    cy.contains("NewPage");
  });

  it("4. Enables pulling remote changes from bottom bar", function() {
    _.gitSync.CreateGitBranch(tempBranch3, false);
    cy.get(explorerLocators.widgetSwitchId).click();
    cy.wait(2000); // wait for transition
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.wait("@updateLayout");
    cy.commitAndPush();
    cy.mergeViaGithubApi({
      repo: repoName,
      base: mainBranch,
      head: tempBranch3,
    });
    cy.switchGitBranch(mainBranch);
    cy.get(gitSyncLocators.bottomBarCommitButton).should("be.visible");
    cy.get(gitSyncLocators.gitPullCount);

    cy.intercept("GET", "/api/v1/git/pull/app/*").as("gitPull");

    cy.get(gitSyncLocators.bottomBarPullButton).click();

    cy.wait("@gitPull");

    cy.get(".bp3-spinner").should("exist");
    cy.get(".bp3-spinner").should("not.exist");

    cy.get(widgetsPage.inputWidget);

    cy.switchGitBranch(tempBranch3);

    cy.widgetText(
      inputNameTempBranch3,
      widgetsPage.inputWidget,
      widgetsPage.widgetNameSpan,
    );

    cy.commitAndPush();

    cy.mergeViaGithubApi({
      repo: repoName,
      base: mainBranch,
      head: tempBranch3,
    });

    cy.switchGitBranch(mainBranch);

    cy.widgetText(
      inputNameTempBranch31,
      widgetsPage.inputWidget,
      widgetsPage.widgetNameSpan,
    );

    cy.commitAndPush(true);

    // reset git status
    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.closeGitSyncModal).click();

    cy.get(gitSyncLocators.gitPullCount);

    cy.get(gitSyncLocators.bottomBarPullButton).click();
    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
    cy.xpath("//span[@name='close-modal']").click({ force: true });
  });

  it("5. Clicking '+' icon on bottom bar should open deploy popup", function() {
    cy.get(gitSyncLocators.bottomBarCommitButton).click({ force: true });
    cy.get(gitSyncLocators.gitSyncModal).should("exist");
    cy.get("[data-cy=t--tab-DEPLOY]").should("exist");
    cy.get("[data-cy=t--tab-DEPLOY]")
      .invoke("attr", "aria-selected")
      .should("eq", "true");
    cy.get(gitSyncLocators.closeGitSyncModal).click({ force: true });
  });

  it("6. Checks clean url updates across branches", () => {
    cy.Deletepage("NewPage");
    cy.wait(1000);
    let legacyPathname = "";
    let newPathname = "";
    cy.intercept("GET", "/api/v1/pages?*mode=EDIT", (req) => {
      req.continue();
    }).as("appAndPages");
    cy.reload();
    //cy.pause();
    cy.wait("@appAndPages").then((intercept2) => {
      const { application, pages } = intercept2.response.body.data;
      const defaultPage = pages.find((p) => p.isDefault);
      legacyPathname = `/applications/${application.id}/pages/${defaultPage.id}`;
      newPathname = `/app/${application.slug}/${defaultPage.slug}-${defaultPage.id}`;
    });

    cy.location().should((location) => {
      expect(location.pathname).includes(newPathname);
    });

    cy.request("PUT", `/api/v1/applications/${applicationId}`, {
      applicationVersion: 1,
    });

    _.gitSync.CreateGitBranch(cleanUrlBranch, false);

    cy.location().should((location) => {
      expect(location.pathname).includes(legacyPathname);
    });

    cy.switchGitBranch(mainBranch);

    cy.get(".t--upgrade").click({ force: true });

    cy.get(".t--upgrade-confirm").click({ force: true });

    cy.location().should((location) => {
      expect(location.pathname).includes(newPathname);
    });

    _.gitSync.CreateGitBranch(cleanUrlBranch, false);
    cy.location().should((location) => {
      expect(location.pathname).includes(legacyPathname);
    });
  });

  after(() => {
    // _.gitSync.DeleteTestGithubRepo(repoName);
    // //cy.deleteTestGithubRepo(repoName);
    // // TODO remove when app deletion with conflicts is fixed
    // cy.get(homePage.homeIcon).click({ force: true });
    // cy.get(homePage.createNew)
    //   .first()
    //   .click({ force: true });
    // cy.wait("@createNewApplication").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   201,
    // );
    // cy.get("#loading").should("not.exist");
    // cy.wait(2000);
    // cy.AppSetupForRename();
    // cy.get(homePage.applicationName).type(repoName + "{enter}");
    // cy.wait("@updateApplication").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
  });
});
