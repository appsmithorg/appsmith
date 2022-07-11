import gitSyncLocators from "../../../../../locators/gitSyncLocators";

let repoName;
let windowOpenSpy;
describe("Git disconnect modal:", function() {
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;
      cy.createTestGithubRepo(repoName);
    });
  });

  it("should be opened with proper components", function() {
    cy.connectToGitRepo(repoName, false);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get("[data-cy=t--tab-GIT_CONNECTION]").click();
    // after clicked disconnect on connection modal,
    // it should be closed and disconnect modal should be opened
    cy.get(gitSyncLocators.disconnectIcon).click();
    cy.get(gitSyncLocators.gitSyncModal).should("not.exist");
    cy.get(gitSyncLocators.disconnectGitModal).should("exist");

    cy.get(gitSyncLocators.disconnectGitModal).contains(
      Cypress.env("MESSAGES").NONE_REVERSIBLE_MESSAGE(),
    );

    // Stubbing window.open
    cy.window().then((window) => {
      windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
        expect(url.startsWith("https://docs.appsmith.com/")).to.be.true;
        windowOpenSpy.restore();
      });
    });
    cy.get(gitSyncLocators.disconnectLearnMoreLink).click();

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { name } = state.ui.gitSync.disconnectingGitApp;
        cy.get(gitSyncLocators.disconnectGitModal).contains(
          Cypress.env("MESSAGES").GIT_REVOKE_ACCESS(name),
        );
        cy.get(gitSyncLocators.disconnectGitModal).contains(
          Cypress.env("MESSAGES").GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS(name),
        );
      });

    // disconnect button should be disabled
    cy.get(gitSyncLocators.disconnectButton).should("be.disabled");
    cy.get(gitSyncLocators.closeDisconnectModal).click();
    cy.wait(2000);
  });

  it("should have disconnect repo button", function() {
    cy.wait(4000);
    cy.get(gitSyncLocators.bottomBarCommitButton).click();
    cy.get("[data-cy=t--tab-GIT_CONNECTION]").click();

    // after clicked disconnect on connection modal,
    // it should be closed and disconnect modal should be opened
    cy.get(gitSyncLocators.disconnectIcon).click();
    cy.get(gitSyncLocators.disconnectButton).should("be.disabled");

    cy.get(gitSyncLocators.disconnectAppNameInput).type(
      `{selectAll}${repoName}`,
    );
    cy.get(gitSyncLocators.disconnectButton).should("be.disabled");

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { name } = state.ui.gitSync.disconnectingGitApp;
        cy.get(gitSyncLocators.disconnectAppNameInput).type(
          `{selectAll}${name}`,
        );
        cy.get(gitSyncLocators.disconnectButton).should("be.enabled");
      });

    // disconnecting validation
    cy.route("POST", "api/v1/git/disconnect/app/*").as("disconnect");
    cy.get(gitSyncLocators.disconnectButton).click();
    //cy.get(gitSyncLocators.disconnectButton).should("be.disabled");
    cy.wait("@disconnect").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    // validation store after disconnected
    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { id, name } = state.ui.gitSync.disconnectingGitApp;
        expect(name).to.eq("");
        expect(id).to.eq("");
      });

    cy.get(gitSyncLocators.disconnectGitModal).should("not.exist");
  });

  after(() => {
    cy.deleteTestGithubRepo(repoName);
  });
});
