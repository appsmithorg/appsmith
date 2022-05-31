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
          // cy.get('[data-testid="t--branch-more-menu-delete"]').click();
          cy.get(".t--branch-more-menu-delete").click();
          // cy.get("[data-cy='t--branch-more-menu-delete']").click();
        });
    });
  });
});
