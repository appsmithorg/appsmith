import { ObjectsRegistry } from "../Objects/Registry";
const GITHUB_API_BASE = "https://api.github.com";

export class GitSync {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;

  private _connectGitBottomBar = ".t--connect-git-bottom-bar";
  private _gitSyncModal = ".git-sync-modal";
  private _closeGitSyncModal = ".t--close-git-sync-modal";
  private _gitRepoInput = ".t--git-repo-input";
  private _useDefaultConfig =
    "//span[text()='Use default configuration']/parent::div";
  private _gitConfigNameInput = ".t--git-config-name-input";
  private _gitConfigEmailInput = ".t--git-config-email-input";
  _branchButton = "[data-testid=t--branch-button-container]";
  private _branchSearchInput = ".t--branch-search-input";


  OpenGitSyncModal() {
    this.agHelper.GetNClick(this._connectGitBottomBar);
    this.agHelper.AssertElementVisible(this._gitSyncModal);
  }

  CloseGitSyncModal() {
    this.agHelper.GetNClick(this._closeGitSyncModal);
    this.agHelper.AssertElementAbsence(this._gitSyncModal);
  }

  CreateNConnectToGit(repoName: string = "Test") {
    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      repoName += uid;
      this.CreateTestGithubRepo(repoName);
      this.ConnectToGitRepo(repoName);
      cy.wrap(repoName).as("gitRepoName");
    });
  }

  private ConnectToGitRepo(repo: string, assertConnect = true) {
    // const testEmail = "test@test.com";
    // const testUsername = "testusername";
    const owner = Cypress.env("TEST_GITHUB_USER_NAME");
    let generatedKey;
    this.OpenGitSyncModal();

    cy.intercept(
      { url: "api/v1/git/connect/app/*", hostname: window.location.host },
      (req) => {
        req.headers["origin"] = "Cypress";
      },
    );

    cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
      `generateKey-${repo}`,
    );

    this.agHelper.AssertAttribute(
      this._gitRepoInput,
      "placeholder",
      "git@example.com:user/repository.git",
    );
    this.agHelper.TypeText(
      this._gitRepoInput,
      `git@github.com:${owner}/${repo}.git`,
    );

    this.agHelper.ClickButton("Generate key");

    cy.wait(`@generateKey-${repo}`).then((result: any) => {
      generatedKey = result.response.body.data.publicKey;
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `${GITHUB_API_BASE}/repos/${Cypress.env(
          "TEST_GITHUB_USER_NAME",
        )}/${repo}/keys`,
        headers: {
          Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
        },
        body: {
          title: "key0",
          key: generatedKey,
        },
      });

      this.agHelper.GetNClick(this._useDefaultConfig); //Uncheck the Use default configuration
      this.agHelper.TypeText(
        this._gitConfigNameInput,
        "testusername",
        //`{selectall}${testUsername}`,
      );
      this.agHelper.TypeText(this._gitConfigEmailInput, "test@test.com");
      this.agHelper.ClickButton("CONNECT");
      if (assertConnect) {
        this.agHelper.ValidateNetworkStatus("@connectGitRepo");
      }
      this.CloseGitSyncModal();
    });
  }

  private CreateTestGithubRepo(repo: string, privateFlag = false) {
    cy.request({
      method: "POST",
      url: `${GITHUB_API_BASE}/user/repos`,
      headers: {
        Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
      },
      body: {
        name: repo,
        private: privateFlag,
      },
    });
  }

  DeleteTestGithubRepo(repo: any) {
    cy.request({
      method: "DELETE",
      url: `${GITHUB_API_BASE}/repos/${Cypress.env(
        "TEST_GITHUB_USER_NAME",
      )}/${repo}`,
      headers: {
        Authorization: `token ${Cypress.env("GITHUB_PERSONAL_ACCESS_TOKEN")}`,
      },
    });
  }

  CreateGitBranch(branch: string = "Test") {
    //this.agHelper.GenerateUUID();
    this.agHelper.GetNClick(this._branchButton);
    this.agHelper.Sleep(2000); //branch pop up to open
    cy.get("@guid").then((uid) => {
      //using the same uid as generated during CreateNConnectToGit
      this.agHelper.TypeText(
        this._branchSearchInput,
        `{selectall}` + `${branch + uid}` + `{enter}`,
        0,
        true,
      );
      cy.wrap(branch + uid).as("gitbranchName");
    });
    this.agHelper.AssertElementExist(this.locator._spinner);
    this.agHelper.AssertElementAbsence(this.locator._spinner, 30000);
  }
}
