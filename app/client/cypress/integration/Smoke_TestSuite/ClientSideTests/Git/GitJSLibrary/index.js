describe("Tests custom js libraries with git", () => {
  cy.generateUUID().then((uid) => {
    repoName = uid;

    cy.createTestGithubRepo(repoName);
    cy.connectToGitRepo(repoName);
  });

  it("1. Commit a newly installed library");
});
