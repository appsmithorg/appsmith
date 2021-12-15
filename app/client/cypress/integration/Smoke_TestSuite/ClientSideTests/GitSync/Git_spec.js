const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import homePage from "../../../../locators/HomePage";

const tempBranch = "tempBranch";
const tempBranch1 = "tempBranch1";
const tempBranch2 = "tempBranch2";
const tempBranch3 = "tempBranch3";
const tempBranch3Page = "tempBranch3Page";
const tempBranch3PageRenamed = "tempBranch3PageRenamed";
const tempBranch3PageRenamed1 = "tempBranch3PageRenamed1";

const buttonNameMainBranch = "buttonMainBranch";
const buttonNameMainBranchEdited = "buttonMainBranchEdited";
const buttonNameTempBranch = "buttonTempBranch";
const buttonNameTempBranch1 = "buttonTempBranch1";
const mainBranch = "master";

let repoName;
describe("Git", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("shows remote is ahead warning and conflict error during commit and push", function() {
    cy.get(explorerLocators.addWidget).click();
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.createGitBranch(tempBranch);
    cy.widgetText(
      buttonNameTempBranch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.commitAndPush();
    cy.mergeViaGithubApi({
      repo: repoName,
      base: mainBranch,
      head: tempBranch,
    });
    cy.switchGitBranch(mainBranch);
    cy.widgetText(
      buttonNameMainBranch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );

    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait("@commit").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      500,
    );

    cy.contains(Cypress.env("MESSAGES").GIT_UPSTREAM_CHANGES());
    cy.get(gitSyncLocators.pullButton).click();
    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("supports merging head to base branch", function() {
    cy.widgetText(
      buttonNameMainBranchEdited,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.createGitBranch(tempBranch1);
    cy.widgetText(
      buttonNameTempBranch1,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.mergeBranchDropdownDestination).click();
    cy.get(commonlocators.dropdownmenu)
      .contains(mainBranch)
      .click();
    // assert conflicting status
    // cy.contains(Cypress.env("MESSAGES").MERGE_CONFLICT_ERROR());
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.switchGitBranch(mainBranch);
    cy.createGitBranch(tempBranch2);
    cy.get(explorerLocators.explorerSwitchId).click({ force: true });
    cy.Createpage("NewPage");
    // cy.merge(mainBranch);
    cy.switchGitBranch(mainBranch);
    // cy.contains("NewPage");
  });

  it.only("enables pulling remote changes, shows conflicts if any", function() {
    // normal pull
    cy.switchGitBranch(mainBranch);
    cy.createGitBranch(tempBranch3);
    cy.Createpage(tempBranch3Page);

    cy.commitAndPush();

    cy.mergeViaGithubApi({
      repo: repoName,
      base: mainBranch,
      head: tempBranch3,
    });

    cy.contains("Page1").click();

    cy.switchGitBranch(mainBranch);

    // reset git status
    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.closeGitSyncModal).click();

    cy.get(gitSyncLocators.loaderQuickGitAction).should("exist");
    cy.get(gitSyncLocators.loaderQuickGitAction).should("not.exist");

    cy.get(gitSyncLocators.bottomBarPullButton).click();

    cy.contains(tempBranch3Page);

    cy.GlobalSearchEntity(tempBranch3Page);
    cy.RenameEntity(tempBranch3PageRenamed, true);

    cy.switchGitBranch(tempBranch3);

    cy.GlobalSearchEntity(tempBranch3Page);
    cy.RenameEntity(tempBranch3PageRenamed1, true);

    cy.commitAndPush();

    cy.mergeViaGithubApi({
      repo: repoName,
      base: mainBranch,
      head: tempBranch3,
    });

    cy.switchGitBranch(mainBranch);

    cy.get(gitSyncLocators.loaderQuickGitAction).should("exist");
    cy.get(gitSyncLocators.loaderQuickGitAction).should("not.exist");

    cy.get(gitSyncLocators.bottomBarPullButton).click();

    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
