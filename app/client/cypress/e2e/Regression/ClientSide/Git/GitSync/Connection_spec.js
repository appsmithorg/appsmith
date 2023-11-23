import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import homePage from "../../../../../locators/HomePage";
import * as _ from "../../../../../support/Objects/ObjectsCore";

const httpsRepoURL = "https://github.com/test/test.git";
const invalidURL = "test";
const invalidURLDetectedOnTheBackend = "test@";
const invalidEmail = "test";
const invalidEmailWithAmp = "test@hello";

let repoName;
let generatedKey;
let windowOpenSpy;
const owner = Cypress.env("TEST_GITHUB_USER_NAME");
describe("Git sync modal: connect tab", function () {
  before(() => {
    _.homePage.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.CreateAppForWorkspace(newWorkspaceName, newWorkspaceName);
    });
    cy.generateUUID().then((uid) => {
      repoName = uid;
      _.gitSync.CreateTestGiteaRepo(repoName);
      //cy.createTestGithubRepo(repoName);
    });
  });

  it("1. validates repo URL", function () {
    // open gitSync modal
    cy.get(homePage.deployPopupOptionTrigger).click({ force: true });
    cy.get(homePage.connectToGitBtn).click({ force: true });

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${httpsRepoURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${invalidURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    // generate key button should be disappeared if empty repo
    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${""}`);
    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.exist");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}${_.dataManager.GITEA_API_URL_TED}/${repoName}.git`,
    );
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO()).should(
      "not.exist",
    );

    cy.get(gitSyncLocators.generateDeployKeyBtn).should("not.be.disabled");

    cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
      "generateKey",
    );
    cy.get(gitSyncLocators.generateDeployKeyBtn).click();

    cy.wait("@generateKey").then((result) => {
      generatedKey = result.response.body.data.publicKey;
    });
  });

  it("2. validates copy key and validates repo url input after key generation", function () {
    cy.window().then((win) => {
      cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
    });

    cy.get(gitSyncLocators.copySshKey).click();
    cy.wait(2000);
    cy.get(gitSyncLocators.gitRepoInput).clear().type(`${httpsRepoURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.connectSubmitBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(`{selectAll}${invalidURL}`);
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO());
    cy.get(gitSyncLocators.connectSubmitBtn).should("be.disabled");

    cy.get(gitSyncLocators.gitRepoInput).type(
      `{selectAll}${_.dataManager.GITEA_API_URL_TED}/${repoName}.git`,
    );
    cy.contains(Cypress.env("MESSAGES").PASTE_SSH_URL_INFO()).should(
      "not.exist",
    );
    cy.get(gitSyncLocators.connectSubmitBtn).should("not.be.disabled");
  });

  it("3. validates git user config", function () {
    cy.get(gitSyncLocators.useGlobalGitConfig).click({ force: true });

    // name empty invalid
    cy.get(gitSyncLocators.gitConfigNameInput).clear();
    cy.get(gitSyncLocators.gitConfigEmailInput).clear();
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").AUTHOR_NAME_CANNOT_BE_EMPTY());
    cy.contains(Cypress.env("MESSAGES").FORM_VALIDATION_INVALID_EMAIL());

    cy.get(gitSyncLocators.gitConfigNameInput).type(`{selectAll}${owner}`);
    cy.get(gitSyncLocators.gitConfigEmailInput).clear();
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").FORM_VALIDATION_INVALID_EMAIL());

    cy.get(gitSyncLocators.gitConfigEmailInput).type(
      `{selectAll}${Cypress.env("USERNAME")}`,
    );
    cy.get(gitSyncLocators.gitConfigNameInput).clear();
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").AUTHOR_NAME_CANNOT_BE_EMPTY());

    // validate email
    cy.get(gitSyncLocators.gitConfigNameInput).type(`{selectAll}${owner}`);
    cy.get(gitSyncLocators.gitConfigEmailInput).type(
      `{selectAll}${invalidEmail}`,
    );
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").FORM_VALIDATION_INVALID_EMAIL());

    cy.get(gitSyncLocators.gitConfigEmailInput).type(
      `{selectAll}${invalidEmailWithAmp}`,
    );
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").FORM_VALIDATION_INVALID_EMAIL());

    cy.get(gitSyncLocators.gitConfigEmailInput).type(
      `{selectAll}${Cypress.env("USERNAME")}`,
    );
    cy.get(gitSyncLocators.connectSubmitBtn).click();
    cy.contains(Cypress.env("MESSAGES").AUTHOR_NAME_CANNOT_BE_EMPTY()).should(
      "not.exist",
    );
    cy.contains(Cypress.env("MESSAGES").FORM_VALIDATION_INVALID_EMAIL()).should(
      "not.exist",
    );

    // check git global config
    cy.get(gitSyncLocators.useGlobalGitConfig).click({ force: true });
    cy.get(gitSyncLocators.gitConfigNameInput).should("be.disabled");
    cy.get(gitSyncLocators.gitConfigEmailInput).should("be.disabled");

    cy.window()
      .its("store")
      .invoke("getState")
      .then((state) => {
        const { authorEmail, authorName } = state.ui.gitSync.globalGitConfig;
        cy.get(gitSyncLocators.gitConfigNameInput).should(
          "have.value",
          authorName,
        );
        cy.get(gitSyncLocators.gitConfigEmailInput).should(
          "have.value",
          authorEmail,
        );
      });
  });

  it("4. validates submit errors", function () {
    cy.get(gitSyncLocators.useGlobalGitConfig).click({ force: true });
    cy.get(gitSyncLocators.gitConfigNameInput)
      .scrollIntoView()
      .type(`{selectAll}${owner}`);
    cy.get(gitSyncLocators.gitConfigEmailInput).type(
      `{selectAll}${Cypress.env("USERNAME")}`,
    );
    cy.wait(200);
    // cy.get(gitSyncLocators.gitConnectionContainer)
    //   .scrollTo("top")
    //   .should("be.visible");
    cy.get(gitSyncLocators.gitRepoInput)
      .click({ force: true })
      .type(`{selectAll}${invalidURLDetectedOnTheBackend}`);
    cy.get(gitSyncLocators.connectSubmitBtn).scrollIntoView();
    cy.get(gitSyncLocators.connectSubmitBtn).should("be.visible");

    cy.get(gitSyncLocators.gitRepoInput)
      .scrollIntoView()
      .type(`{selectAll}${_.dataManager.GITEA_API_URL_TED}/${repoName}.git`, {
        force: true,
      });
    cy.get(gitSyncLocators.connectSubmitBtn).scrollIntoView().click();
    cy.get(gitSyncLocators.connetStatusbar).should("exist");
    cy.wait("@connectGitLocalRepo").then((interception) => {
      const status = interception.response.body.responseMeta.status;
      expect(status).to.be.gte(400);
      // todo check for error msg based on the context
    });

    cy.get(gitSyncLocators.gitRepoInput)
      .scrollIntoView()
      .type(`{selectAll}${_.dataManager.GITEA_API_URL_TED}/${repoName}.git`, {
        force: true,
      });

    // cy.request({
    //   method: "POST",
    //   url: `${GITHUB_API_BASE}/repos/${Cypress.env(
    //     "TEST_GITHUB_USER_NAME",
    //   )}/${repoName}/keys`,
    //   headers: {
    //     Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
    //   },
    //   body: {
    //     title: "key0",
    //     key: generatedKey,
    //     read_only: true,
    //   },
    // });

    cy.request({
      method: "POST",
      url: `${_.dataManager.GITEA_API_BASE_TED}:${_.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repoName}/keys`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
      body: {
        title: "key1",
        key: generatedKey,
        read_only: true,
      },
    });

    cy.get(gitSyncLocators.connectSubmitBtn).scrollIntoView().click();
    // cy.get(gitSyncLocators.connetStatusbar).should("exist");
    cy.wait("@connectGitLocalRepo").then((interception) => {
      const status = interception.response.body.responseMeta.status;
      expect(status).to.be.gte(400);
      // todo check for error msg based on the context
    });

    // read document clicking test
    cy.get(gitSyncLocators.errorCallout).contains("Learn more");
    cy.window().then((window) => {
      windowOpenSpy = cy.stub(window, "open").callsFake((url) => {
        // todo: check if we can improve this
        expect(!!url).to.be.true;
        windowOpenSpy.restore();
      });
    });
    cy.get(gitSyncLocators.errorCallout).contains("Learn more").click();
    cy.get(gitSyncLocators.closeGitSyncModal).click();
  });

  after(() => {
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});
