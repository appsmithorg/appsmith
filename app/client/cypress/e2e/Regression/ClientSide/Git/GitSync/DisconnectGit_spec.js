import * as _ from "../../../../../support/Objects/ObjectsCore";

let repoName;
let windowOpenSpy;
describe(
  "Git disconnect modal:",
  {
    tags: [
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    before(() => {
      _.homePage.NavigateToHome();
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        const newWorkspaceName = interception.response.body.data.name;
        cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
      });
    });

    it("1. should be opened with proper components", function () {
      cy.generateUUID().then((uid) => {
        _.gitSync.CreateNConnectToGit(uid);
        cy.get("@gitRepoName").then((repName) => {
          repoName = repName;
        });
      });
      _.gitSync.OpenSettingsModal();
      // after clicked disconnect on connection modal,
      // it should be closed and disconnect modal should be opened
      cy.get(_.gitSync.locators.disconnectBtn).click();
      cy.get(_.gitSync.locators.settingsModal).should("not.exist");
      cy.get(_.gitSync.locators.disconnectModal).should("exist");

      cy.get(_.gitSync.locators.disconnectModal).contains(
        Cypress.env("MESSAGES").NONE_REVERSIBLE_MESSAGE(),
      );

      // Stubbing window.open
      cy.window().then((window) => {
        windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
          expect(url.startsWith("https://docs.appsmith.com/")).to.be.true;
          windowOpenSpy.restore();
        });
      });
      cy.get(_.gitSync.locators.disconnectModalLearnMoreLink).click();

      cy.window()
        .its("store")
        .invoke("getState")
        .then((state) => {
          const { name } = state.ui.gitSync.disconnectingGitApp;
          cy.get(_.gitSync.locators.disconnectModal).contains(
            Cypress.env("MESSAGES").GIT_REVOKE_ACCESS(name),
          );
          cy.get(_.gitSync.locators.disconnectModal).contains(
            Cypress.env("MESSAGES").GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS(
              name,
            ),
          );
        });

      // disconnect button should be disabled
      cy.get(_.gitSync.locators.disconnectModalRevokeBtn).should("be.disabled");
      cy.get(_.gitSync.locators.disconnectModalCloseBtn).click();
      cy.wait(2000);
    });

    it("2. should have disconnect repo button", function () {
      _.gitSync.OpenSettingsModal();

      // after clicked disconnect on connection modal,
      // it should be closed and disconnect modal should be opened
      cy.get(_.gitSync.locators.disconnectBtn).click();
      cy.get(_.gitSync.locators.disconnectModalRevokeBtn).should("be.disabled");

      cy.get(_.gitSync.locators.disconnectModalInput).type(
        `{selectAll}${repoName}`,
      );
      cy.get(_.gitSync.locators.disconnectModalRevokeBtn).should("be.disabled");

      cy.window()
        .its("store")
        .invoke("getState")
        .then((state) => {
          const { name } = state.ui.gitSync.disconnectingGitApp;
          cy.get(_.gitSync.locators.disconnectModalInput).type(
            `{selectAll}${name}`,
          );
          cy.get(_.gitSync.locators.disconnectModalRevokeBtn).should(
            "be.enabled",
          );
        });

      // disconnecting validation
      cy.intercept("POST", "api/v1/git/disconnect/app/*").as("disconnect");
      cy.get(_.gitSync.locators.disconnectModalRevokeBtn).click();
      cy.wait(3000);
      //cy.get(_.gitSync.locators.disconnectModalRevokeBtn).should("be.disabled");
      cy.wait("@disconnect").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get(_.gitSync.locators.disconnectModal).should("not.exist");
    });

    after(() => {
      _.gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);
