import gitSyncLocators from "../../../../locators/gitSyncLocators";

let repoName;
describe("Git sync modal: deploy tab", function() {
  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName, false);
    });
  });

  it("Validate commit comment inputbox and last deployed preview", function() {
    // last deployed preview
    // The deploy preview Link should be displayed only after the first commit done
    cy.get(gitSyncLocators.deployPreview).should("not.exist");

    // comment text input should not empty
    cy.get(gitSyncLocators.commitCommentInput)
      .invoke("val")
      .should("not.be.empty");
    cy.get(gitSyncLocators.commitCommentInput).clear();
    cy.get(gitSyncLocators.commitButton).should("be.disabled");
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");

    cy.get(gitSyncLocators.commitButton).click();
    // check for commit success
    cy.wait("@commit").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    // last deployed preview
    // it should be updated with the each commit and push
    cy.get(gitSyncLocators.deployPreview).should("exist");
    cy.get(gitSyncLocators.deployPreview).contains(`secs ago`);

    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
