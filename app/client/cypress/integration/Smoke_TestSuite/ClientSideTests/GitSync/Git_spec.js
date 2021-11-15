const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");

const tempBranchKey = "tempBranchKey";
const buttonNameMainBranch = "buttonMainBranch";
const buttonNameTempBranch = "buttonTempBranch";
const buttonNameTemp2Branch = "buttonTemp2Branch";
const mainBranch = "master";

describe("Git", function() {
  before(() => {
    cy.createTestGithubRepo();
    cy.connectToGitRepo();
  });

  it("can merge branches, shows remote is ahead warning and conflict error during commit and push", function() {
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.createGitBranch(tempBranchKey);
    cy.widgetText(
      buttonNameTempBranch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.commitAndPush();

    // merge the branch to parent branch

    cy.switchGitBranch(mainBranch);

    cy.widgetText(
      buttonNameMainBranch,
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );

    cy.commitAndPush();

    // check for remote is ahead

    // click on pull button

    // check for conflict error
  });

  it("shows conflicting state while trying to merge branches", function() {
    // create a new branch from the main branch
    // rename the button
    // try to merge it to tempBranch, should show a conflict
  });

  it("enables pulling remote changes, shows conflicts if any", function() {
    //// normal pull
    // switch to master
    // create a branch and make changes
    // push changes
    // merge branch to master
    // switch back to master
    // check for commits to pull count
    // pull changes -> verify pulled changes reflect on canvas
    //// pull leading to conflicts
    // create another branch
    // update button name
    // switch to master -> edit button name
    // merge to master
    // switch back to master and pull
    // verify conflicting state
  });

  after(() => {
    cy.deleteTestGithubRepo();
  });
});
