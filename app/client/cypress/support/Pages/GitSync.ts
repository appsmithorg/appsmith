import { ObjectsRegistry } from "../Objects/Registry";
const GITHUB_API_BASE = "https://api.github.com";
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
      //this.CreateTestGithubRepo(repoName);
      this.CreateLocalGithubRepo(repoName);
      //this.ConnectToGitRepo(repoName);
      cy.get("@remoteUrl").then((remoteUrl: any) => {
        this.AuthorizeLocalGitSSH(remoteUrl);
      });
      cy.wrap(repoName).as("gitRepoName");
    });
  }

  private ConnectToGitRepo(repo: string, assertConnect = true) {
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
        this.agHelper.ValidateNetworkStatus("@connectGitLocalRepo");
      }
      this.CloseGitSyncModal();
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
        body: formdata,
        headers: {
          //"Content-Type": "multipart/form-data"
        },
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
        this.ReplaceForGit("cypress/fixtures/Bugs/GitConnectResponse.json", remoteUrl);
        //cy.get('@connectGitLocalRepo').its('response.statusCode').should('equal', 200);
        //this.agHelper.ValidateNetworkStatus("@connectGitLocalRepo");

        // cy.intercept(
        //   {
        //     method: "POST",
        //     url: "/api/v1/git/connect/app/*",
        //     hostname: window.location.host,
        //   },
        //   (req) => {
        //     req.headers["origin"] = "Cypress";
        //   },
        // );

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
