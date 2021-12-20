import gitSyncLocators from "../../../../locators/gitSyncLocators";

let repoName;
describe("Repo Limit Exceeded Error Modal", function() {
  // before(() => {
  //   cy.generateUUID().then((uid) => {
  //     repoName = uid;
  //     cy.createTestGithubRepo(repoName);
  //     cy.connectToGitRepo(repoName);
  //   });
  // });
  // it.only("modal should be opened with proper components", function() {
  //   cy.window()
  //   .its('store')
  //   .invoke('dispatch', { type: 'SET_SHOULD_SHOW_REPO_LIMIT_ERROR', payload: true });
  //   cy.get(gitSyncLocators.connectGitBottomBar).click({ force: true });
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("exist");
  //   // title and info text checking
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal)
  //     .contains(Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED());
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal)
  //     .contains(Cypress.env("MESSAGES").REPOSITORY_LIMIT_REACHED_INFO());
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal)
  //     .contains(Cypress.env("MESSAGES").CONTACT_SUPPORT_TO_UPGRADE());
  //   cy.get(gitSyncLocators.contactSalesButton).should("exist");
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal)
  //     .contains(Cypress.env("MESSAGES").DISCONNECT_CAUSE_APPLICATION_BREAK());
  //   cy.get(gitSyncLocators.connectedApplication).should("have.length", 3);
  //   cy.get(gitSyncLocators.diconnectLink).click();
  //   cy.get(gitSyncLocators.repoLimitExceededErrorModal).should("not.exist");
  //   cy.get(gitSyncLocators.disconnectGitModal).should("exist");
  // });
  // after(() => {
  //   cy.deleteTestGithubRepo(repoName);
  // });
});
