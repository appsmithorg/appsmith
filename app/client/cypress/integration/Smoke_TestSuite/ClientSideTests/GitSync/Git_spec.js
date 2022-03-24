const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const explorerLocators = require("../../../../locators/explorerlocators.json");
import gitSyncLocators from "../../../../locators/gitSyncLocators";
import homePage from "../../../../locators/HomePage";

const tempBranch = "tempBranch";
const tempBranch0 = "tempBranch0";
const tempBranch1 = "tempBranch1";
const tempBranch2 = "tempBranch2";
const tempBranch3 = "tempBranch3";

const buttonNameMainBranch = "buttonMainBranch";
const buttonNameMainBranchEdited = "buttonMainBranchEdited";
const buttonNameTemp0Branch = "buttonTemp0Branch";
const buttonNameTempBranch1 = "buttonTempBranch1";
const mainBranch = "master";

const inputNameTempBranch3 = "inputNameTempBranch3";
const inputNameTempBranch31 = "inputNameTempBranch31";

let repoName;
describe("Git sync:", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createOrg();
    cy.wait("@createOrg").then((interception) => {
      const newOrganizationName = interception.response.body.data.name;
      cy.CreateAppForOrg(newOrganizationName, newOrganizationName);
    });

    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });

  it("shows remote is ahead warning and conflict error during commit and push", function() {
    cy.createGitBranch(tempBranch);
    cy.get(explorerLocators.widgetSwitchId).click();
    cy.wait(2000); // wait for transition
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.createGitBranch(tempBranch0);
    cy.widgetText(
      buttonNameTemp0Branch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.commitAndPush();
    cy.mergeViaGithubApi({
      repo: repoName,
      base: tempBranch,
      head: tempBranch0,
    });
    cy.switchGitBranch(tempBranch);
    cy.widgetText(
      buttonNameMainBranch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
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

  it("detect conflicts when merging head to base branch", function() {
    cy.switchGitBranch(mainBranch);
    cy.get(explorerLocators.widgetSwitchId).click();
    cy.wait(2000); // wait for transition
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.createGitBranch(tempBranch1);
    cy.widgetText(
      buttonNameTempBranch1,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.commitAndPush();

    cy.switchGitBranch(mainBranch);
    cy.widgetText(
      buttonNameMainBranchEdited,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.commitAndPush();

    cy.switchGitBranch(tempBranch1);

    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.mergeBranchDropdownDestination).click();
    cy.get(commonlocators.dropdownmenu)
      .contains(mainBranch)
      .click();
    // assert conflicting status
    cy.contains("Please resolve the conflicts manually");
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  it("supports merging head to base branch", function() {
    cy.switchGitBranch(mainBranch);
    cy.createGitBranch(tempBranch2);
    cy.get(explorerLocators.explorerSwitchId).click({ force: true });
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.Createpage("NewPage");
    cy.commitAndPush();
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.switchGitBranch(mainBranch);
    cy.contains("NewPage");
  });

  it("enables pulling remote changes from bottom bar", function() {
    cy.createGitBranch(tempBranch3);
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

    cy.get(gitSyncLocators.gitPullCount);

    cy.intercept("GET", "/api/v1/git/pull/*").as("gitPull");

    cy.get(gitSyncLocators.bottomBarPullButton).click();

    cy.wait("@gitPull");

    cy.get(".bp3-spinner").should("exist");
    cy.get(".bp3-spinner").should("not.exist");

    cy.get(widgetsPage.inputWidget);

    cy.switchGitBranch(tempBranch3);

    cy.widgetText(
      inputNameTempBranch3,
      widgetsPage.inputWidget,
      commonlocators.inputWidgetInner,
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
      commonlocators.inputWidgetInner,
    );

    cy.commitAndPush(true);

    // reset git status
    cy.get(gitSyncLocators.bottomBarMergeButton).click();
    cy.get(gitSyncLocators.closeGitSyncModal).click();

    cy.get(gitSyncLocators.gitPullCount);

    cy.get(gitSyncLocators.bottomBarPullButton).click();

    cy.contains(Cypress.env("MESSAGES").GIT_CONFLICTING_INFO());
    cy.get("body").type("{esc}");
  });

  //Skipping until flaky fix
  it.skip("clicking '+' icon on bottom bar should open deploy popup", function() {
    cy.get(gitSyncLocators.bottomBarCommitButton).click({ force: true });
    cy.get(gitSyncLocators.gitSyncModal).should("exist");
    cy.get("[data-cy=t--tab-DEPLOY]").should("exist");
    cy.get("[data-cy=t--tab-DEPLOY]")
      .invoke("attr", "aria-selected")
      .should("eq", "true");
    cy.get(gitSyncLocators.closeGitSyncModal).click({ force: true });
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);

    // TODO remove when app deletion with conflicts is fixed
    cy.get(homePage.homeIcon).click({ force: true });
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get("#loading").should("not.exist");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.AppSetupForRename();
    cy.get(homePage.applicationName).type(repoName + "{enter}");
    cy.wait("@updateApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
