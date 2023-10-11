import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import {
  agHelper,
  homePage,
  gitSync,
} from "../../../../../support/Objects/ObjectsCore";

describe("Git regenerate SSH key flow", function () {
  let repoName;

  it("1. Verify SSH key regeneration flow ", () => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      homePage.CreateNewWorkspace("ssh_" + uid);
      homePage.CreateAppInWorkspace("ssh_" + uid);
    });
    gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
      cy.regenerateSSHKey(repoName);
    });
    agHelper.ClickOutside();
    cy.wait(2000);
  });

  it("2. Verify error meesage is displayed when ssh key is not added to github and verify RSA SSH key regeneration flow", () => {
    cy.wait(2000);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get('[data-testid="t--tab-GIT_CONNECTION"]').click();
    cy.wait(2000);
    cy.get(gitSyncLocators.SSHKeycontextmenu).eq(2).click();
    cy.get(gitSyncLocators.regenerateSSHKeyECDSA).click();
    cy.contains(Cypress.env("MESSAGES").REGENERATE_KEY_CONFIRM_MESSAGE());
    cy.xpath(gitSyncLocators.confirmButton).click();
    agHelper.RefreshPage();
    cy.wait(2000);
    cy.validateToastMessage(Cypress.env("MESSAGES").ERROR_GIT_AUTH_FAIL());
    cy.wait("@gitStatus");
    cy.wait("@gitStatus").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      400,
    );
    cy.regenerateSSHKey(repoName, true, "RSA");
    cy.get("body").click(0, 0, { force: true });
    cy.wait(2000);
  });
  after(() => {
    gitSync.DeleteTestGithubRepo(repoName);
    cy.DeleteAppByApi();
  });
});
