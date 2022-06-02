import homePage from "../../../../locators/HomePage";
import gitSyncLocators from "../../../../locators/gitSyncLocators";
let repoName;
let branchName;
describe("Delete branch", () => {
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
            cy.get(".t--branch-more-menu-delete").click();
            cy.wait(2000);
          });
        // verify remote branch is there for the deleted local branch
        //cy.get(gitSyncLocators.branchButton).click({ force: true });
        cy.wait(2000);
        cy.get('[data-testid="t--git-remote-branch-list-container"]')
          .contains(`origin/${branchName}`)
          .click();
        cy.wait("@applications").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(2000);
        //cy.get(".t--close-branch-list").click();
      });
    });
  });
  it("2. Create child branch, merge data from child branch, delete child branch verify the data should reflect in master ", () => {
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
  it("3. Create new branch, commit data in that branch , delete the branch, verify data should not reflect in master ", () => {
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
  /*it("4. Delete branch from UI, but the same branch should be display in remote ", () => {
    /*cy.generateUUID().then((uid) => {
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
  }); */
  /*it.skip("5. Local branch creation from remote ", () => {
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
  }); */
  it("4. Default branch deletion not allowed ", () => {
    cy.switchGitBranch("master");
    cy.get(gitSyncLocators.branchButton).click({ force: true });
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
  it("5. local branch deletion not allowed ", () => {
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
        `Cannot delete checked out branch. Please check out other branch before deleting:${branchName} .`,
      );
    });
  });
});
