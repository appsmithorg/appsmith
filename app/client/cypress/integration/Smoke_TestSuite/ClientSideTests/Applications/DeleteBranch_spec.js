import homePage from "../../../../locators/HomePage";
import gitSyncLocators from "../../../../locators/gitSyncLocators";
let repoName;
let branchName;
describe("Delete branch", () => {
  it("git connection", () => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
      //cy.get(".t--close-git-sync-modal").click()
    });
  });
  it("Create Branch", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get('[data-testid="t--branch-button-currentBranch"]').click();
      cy.wait(2000);
      cy.get('[data-testid="t--default-tag"]').click();
      cy.wait(2000);
      cy.get(".t--branch-button").click();
      cy.get(".t--branch-item")
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu").click();
          //cy.get("[data-testid='t--branch-more-menu-delete']").click();
          cy.get(".t--branch-more-menu-delete").click();
          // cy.get("[data-cy='t--branch-more-menu-delete']").click();
        });
      cy.get(".t--close-branch-list").click();
    });
  });
  it("Merge data from child branch now delete child branch the data should be reflecting in master ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get("#switcher--widgets").click();
      cy.dragAndDropToCanvas("checkboxwidget", { x: 100, y: 200 });
      cy.get(".t--draggable-checkboxwidget").should("exist");
      cy.commitAndPush();
      cy.merge("master");
      cy.get(".t--close-git-sync-modal").click();
      cy.get('[data-testid="t--branch-button-currentBranch"]').click();
      cy.wait(2000);
      cy.get('[data-testid="t--default-tag"]').click();
      cy.get(".t--draggable-checkboxwidget").should("be.visible");
    });
  });
  it("commit data in child branch now delete child branch the data shouldnot reflect in master ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get("#switcher--widgets").click();
      cy.dragAndDropToCanvas("chartwidget", { x: 210, y: 300 });
      cy.get(".t--widget-chartwidget").should("exist");
      cy.commitAndPush();
      cy.wait(1000);
      cy.get(".t--branch-button").click();
      cy.get('[data-testid="t--default-tag"]').click();
      cy.wait(2000);
      cy.get(".t--branch-button").click();
      cy.get(".t--branch-item")
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu").click();
          cy.get(".t--branch-more-menu-delete").click();
        });
      //cy.get('[data-testid="t--default-tag"]').click();
      cy.get(".--widget-chartwidget").should("not.exist");
      cy.get(gitSyncLocators.branchButton).click({ force: true });
    });
  });
  it("delete barnch from UI, but the same branch should be display in remote ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.wait(2000);
      cy.createGitBranch(branchName);
      cy.wait(1000);
      //  cy.get('[data-testid="t--branch-button-currentBranch"]').click();
      // cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.wait(2000);
      cy.switchGitBranch("master");
      cy.wait(2000);
      cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.get(".t--branch-item")
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu")
            .scrollIntoView()
            .click({ force: true });
          cy.get(".t--branch-more-menu-delete").click();
        });
      cy.get(gitSyncLocators.branchButton).click({ force: true });
      cy.get('[data-testid="t--git-remote-branch-list-container"]').contains(
        `origin/${branchName}`,
      );
    });
  });
  it("local branch creation from remote ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);

      cy.get(".t--branch-button").click();
      cy.wait(2000);
      cy.get('[data-testid="t--default-tag"]').click();
      cy.wait(2000);
      //cy.get(".t--branch-button").click();
      cy.get(".t--branch-item")
        .eq(2)
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu")
            .scrollIntoView()
            .click({ force: true });
          cy.get(".t--branch-more-menu-delete").click();
        });
      cy.get(".t--branch-button").click();
      cy.get('[data-testid="t--git-remote-branch-list-container"]')
        .contains(`origin/${branchName}`)
        .click();
    });
  });
  it("Default branch deletion not allowed ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get(".t--branch-button").click();
      cy.wait(2000);
      cy.get('[data-testid="t--default-tag"]')
        .click()
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu")
            .scrollIntoView()
            .click({ force: true });
          cy.get(".t--branch-more-menu-delete").click();
        });
      cy.get(homePage.toastMessage).should(
        "contain",
        "Cannot delete default branch: master",
      );
    });
  });
  it("local branch deletion not allowed ", () => {
    cy.generateUUID().then((uid) => {
      branchName = uid;
      cy.createGitBranch(branchName);
      cy.wait(1000);
      cy.get(".t--branch-button").click();
      cy.wait(2000);
      cy.get(".t--branch-item")
        .eq(1)
        .trigger("mouseenter")
        .within(() => {
          cy.get(".git-branch-more-menu")
            .scrollIntoView()
            .click({ force: true });
          //cy.get("[data-testid='t--branch-more-menu-delete']").click();
          cy.get(".t--branch-more-menu-delete").click();
        });
      cy.get(homePage.toastMessage).should(
        "contain",
        "Cannot delete checked out branch. Please check out other branch before deleting:${branchName} .",
      );
    });
  });
});
