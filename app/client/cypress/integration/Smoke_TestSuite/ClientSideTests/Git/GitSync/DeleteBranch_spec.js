import homePage from "../../../../../locators/HomePage";
import gitSyncLocators from "../../../../../locators/gitSyncLocators";

let repoName;
let branchName;
describe("Delete branch flow", () => {
  it("1. Connect app to git, create new branch and delete it", () => {
    // create git repo and connect app to git
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
      cy.generateUUID().then((uid) => {
        branchName = uid;
        cy.createGitBranch(branchName);
        cy.wait(1000);
        // verify can not delete the checked out branch
        cy.get(gitSyncLocators.branchButton).click();
        cy.get(gitSyncLocators.branchListItem)
          .eq(1)
          .trigger("mouseenter")
          .within(() => {
            cy.get(gitSyncLocators.gitBranchContextMenu).click();
            cy.get(gitSyncLocators.gitBranchDelete).click();
          });
        cy.get(homePage.toastMessage).should(
          "contain",
          `Cannot delete checked out branch. Please check out other branch before deleting ${branchName}.`,
        );
        cy.get(gitSyncLocators.closeBranchList).click();
        // switch to master and delete new branch created
        cy.switchGitBranch("master");
        cy.wait(2000);
        cy.get(gitSyncLocators.branchButton).click();
        cy.get(gitSyncLocators.branchListItem)
          .eq(1)
          .trigger("mouseenter")
          .within(() => {
            cy.get(gitSyncLocators.gitBranchContextMenu).click();
            cy.get(gitSyncLocators.gitBranchDelete).click();
          });
        cy.wait("@deleteBranch").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.get(gitSyncLocators.closeBranchList).click();
        // verify remote branch is there for the deleted local branch
        cy.wait(2000);
        cy.switchGitBranch(`origin/${branchName}`);
        cy.wait(2000);
      });
    });
  });
  it("2. Create child branch, merge data from child branch, delete child branch verify the data should reflect in master ", () => {
    cy.switchGitBranch("master");
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get("#switcher--widgets").click();
      cy.dragAndDropToCanvas("checkboxwidget", { x: 100, y: 200 });
      cy.get(".t--draggable-checkboxwidget").should("exist");
      cy.wait(2000);
      cy.commitAndPush();
      cy.merge("master");
      cy.get(".t--close-git-sync-modal").click();
      cy.switchGitBranch("master");
      cy.wait(2000);
      cy.get(gitSyncLocators.branchButton).click();
      cy.get(gitSyncLocators.branchListItem)
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.get(gitSyncLocators.gitBranchContextMenu).click();
          cy.get(gitSyncLocators.gitBranchDelete).click();
        });
      cy.wait("@deleteBranch").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(gitSyncLocators.closeBranchList).click();
      cy.get(".t--draggable-checkboxwidget").should("be.visible");
    });
  });
  it("3. Create new branch, commit data in that branch , delete the branch, verify data should not reflect in master ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get("#switcher--widgets").click();
      cy.dragAndDropToCanvas("chartwidget", { x: 210, y: 300 });
      cy.get(".t--widget-chartwidget").should("exist");
      cy.wait(2000);
      cy.commitAndPush();
      cy.wait(1000);
      cy.switchGitBranch("master");
      cy.wait(3000);
      cy.get(gitSyncLocators.branchButton).click();
      cy.get(gitSyncLocators.branchListItem)
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.wait(1000);
          cy.get(gitSyncLocators.gitBranchContextMenu).click();
          cy.wait(1000);
          cy.get(gitSyncLocators.gitBranchDelete).click();
        });
      cy.wait("@deleteBranch").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(".--widget-chartwidget").should("not.exist");
    });
  });
  /*it("4. Verify Default branch deletion not allowed ", () => {
    cy.get(".t--branch-item")
      .eq(0)
      .click()
      .trigger("mouseenter")
      .within(() => {
        cy.get(".git-branch-more-menu").click({ force: true });
        cy.get(".t--branch-more-menu-delete").click();
      });
    cy.get(homePage.toastMessage).should(
      "contain",
      "Cannot delete default branch: master",
    );
  }); */
});
