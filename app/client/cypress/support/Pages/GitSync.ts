import { ObjectsRegistry } from "../Objects/Registry";
const GITHUB_API_BASE = "https://api.github.com";
const GITEA_API_BASE = "http://35.154.225.218";
import datasourceFormData from "../../fixtures/datasources.json";

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
  private _bottomBarCommit = ".t--bottom-bar-commit span[name='plus']";
  _bottomBarPull = ".t--bottom-bar-pull span[name='down-arrow-2']";
  private _branchName = (branch: string) =>
    "//div[contains(@class, 't--branch-button')]//*[text()='" + branch + "']";
  _checkMergeability = "//span[contains(text(), 'Checking mergeability')]";

  OpenGitSyncModal() {
    this.agHelper.GetNClick(this._connectGitBottomBar);
    this.agHelper.AssertElementVisible(this._gitSyncModal);
  }

  CloseGitSyncModal() {
    this.agHelper.GetNClick(this._closeGitSyncModal);
    this.agHelper.AssertElementAbsence(this._gitSyncModal);
  }

  CreateNConnectToGit(
    repoName: string = "Test",
    assertConnect = true,
    privateFlag = false,
  ) {
    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      repoName += uid;
      this.CreateTestGiteaRepo(repoName, privateFlag);
      //this.CreateLocalGithubRepo(repoName);
      this.AuthorizeKeyToGitea(repoName, assertConnect);
      // cy.get("@remoteUrl").then((remoteUrl: any) => {
      //   this.AuthorizeLocalGitSSH(remoteUrl);
      // });
      cy.wrap(repoName).as("gitRepoName");
    });
  }

  public AuthorizeKeyToGitea(repo: string, assertConnect = true) {
    // const testEmail = "test@test.com";
    // const testUsername = "testusername";
    const owner = Cypress.env("TEST_GITHUB_USER_NAME");
    let generatedKey;
    this.OpenGitSyncModal();
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
      `git@35.154.225.218:CI-Gitea/${repo}.git`,
      //`git@github.com:${owner}/${repo}.git`,
    );

    this.agHelper.ClickButton("Generate key");

    cy.wait(`@generateKey-${repo}`).then((result: any) => {
      generatedKey = result.response.body.data.publicKey;
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `${GITEA_API_BASE}:3000/api/v1/repos/CI-Gitea/${repo}/keys`,
        headers: {
          Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
        },
        body: {
          title: "key0",
          key: generatedKey,
          read_only: false,
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
        this.agHelper.ValidateNetworkStatus("@connectGitLocalRepo");
        this.agHelper.AssertElementExist(this._bottomBarCommit, 0, 30000);
        this.CloseGitSyncModal();
      }
    });
  }

  private AuthorizeLocalGitSSH(remoteUrl: string, assertConnect = true) {
    let generatedKey;
    this.OpenGitSyncModal();
    this.agHelper.AssertAttribute(
      this._gitRepoInput,
      "placeholder",
      "git@example.com:user/repository.git",
    );
    this.agHelper.TypeText(this._gitRepoInput, remoteUrl);

    this.agHelper.ClickButton("Generate key");

    cy.wait(`@generateKey`).then((result: any) => {
      generatedKey = result.response.body.data.publicKey;
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
      var formdata = new FormData();
      cy.log("generatedKey is " + generatedKey);
      formdata.set("sshkey", generatedKey);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `http://${datasourceFormData["GITHUB_API_BASE_TED"]}:${datasourceFormData["GITHUB_API_PORT_TED"]}/v1/gitserver/addgitssh`,
        //body: formdata,
        body: {
          sshkey: generatedKey,
        },
        form: true,
        // headers: {
        //   "Content-Type": "application/x-www-form-urlencoded"
        // },
      }).then((response) => {
        expect(response.status).to.equal(200);
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
        //this.ReplaceForGit("cypress/fixtures/Bugs/GitConnectResponse.json", remoteUrl);
        //cy.get('@connectGitLocalRepo').its('response.statusCode').should('equal', 200);
        // cy.intercept("POST", "/api/v1/git/connect/app/*", {
        //   fixture: "/Bugs/GitConnectResponse.json",
        // });
        this.agHelper.ValidateNetworkStatus("@connectGitLocalRepo");
      }
      this.CloseGitSyncModal();
    });
  }

  private ReplaceForGit(fixtureFile: any, remoteUrl: string) {
    let currentAppId, currentURL;
    cy.readFile(
      fixtureFile,
      // (err: string) => {
      // if (err) {
      //   return console.error(err);
      // }}
    ).then((data) => {
      cy.url().then((url) => {
        currentURL = url;
        const myRegexp = /page-1(.*)/;
        const match = myRegexp.exec(currentURL);
        cy.log(currentURL + "currentURL from intercept is");
        currentAppId = match ? match[1].split("/")[1] : null;
        data.data.id = currentAppId;
        data.data.gitApplicationMetadata.defaultApplicationId = currentAppId;
        data.data.gitApplicationMetadata.remoteUrl = remoteUrl;
        cy.writeFile(fixtureFile, JSON.stringify(data));
      });
    });
  }

  public CreateTestGiteaRepo(repo: string, privateFlag = false) {
    cy.request({
      method: "POST",
      url: `${GITEA_API_BASE}:3000/api/v1/org/CI-Gitea/repos`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
      body: {
        name: repo,
        private: privateFlag,
      },
    });
  }

  private CreateLocalGithubRepo(repo: string) {
    let remoteUrl: string = "";
    cy.request({
      method: "GET",
      url:
        `http://${datasourceFormData["GITHUB_API_BASE_TED"]}:${datasourceFormData["GITHUB_API_PORT_TED"]}/v1/gitserver/addrepo?reponame=` +
        repo,
    }).then((response) => {
      remoteUrl = JSON.stringify(response.body).replace(/['"]+/g, "");
      expect(response.status).to.equal(200);
      //cy.log("remoteUrl is"+ remoteUrl);
      cy.wrap(remoteUrl).as("remoteUrl");
    });
  }

  DeleteTestGithubRepo(repo: any) {
    cy.request({
      method: "DELETE",
      url: `${GITEA_API_BASE}:3000/api/v1/repos/CI-Gitea/${repo}`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
    });
  }

  CreateGitBranch(branch: string = "Test", toUseNewGuid = false) {
    if (toUseNewGuid) this.agHelper.GenerateUUID();
    this.agHelper.AssertElementExist(this._bottomBarCommit);
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
      this.agHelper.AssertElementExist(this.locator._runBtnSpinner);
      this.agHelper.AssertElementAbsence(this.locator._runBtnSpinner, 70000); //Since page taking more time to laod in some cases
      this.agHelper.AssertElementVisible(this._branchName(branch + uid));
      cy.wrap(branch + uid).as("gitbranchName");
    });
  }
}
