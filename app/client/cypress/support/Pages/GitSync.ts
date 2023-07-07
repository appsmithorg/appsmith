import { ObjectsRegistry } from "../Objects/Registry";
const GITHUB_API_BASE = "https://api.github.com";
//const GITEA_API_BASE = "http://35.154.225.218";

export class GitSync {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private hostPort = ObjectsRegistry.DefaultHostPort;
  private assertHelper = ObjectsRegistry.AssertHelper;

  private _connectGitBottomBar = ".t--connect-git-bottom-bar";
  private _gitSyncModal = "[data-testid=t--git-sync-modal]";
  private _closeGitSyncModal =
    "//div[@data-testid='t--git-sync-modal']//button[@aria-label='Close']";
  //private _closeGitSyncModal = ".ads-v2-modal__content-header-close-button";
  private _gitRepoInput =
    "//label[text()='Remote URL']/following-sibling::div//input";
  private _useDefaultConfig = "//label[text()='Use default configuration']";
  private _gitConfigNameInput =
    "//label[text()='Author name']/following-sibling::div//input";
  private _gitConfigEmailInput =
    "//label[text()='Author email']/following-sibling::div//input";
  _branchButton = ".t--branch-button";
  private _branchSearchInput = ".t--branch-search-input input";
  private _bottomBarCommit = ".t--bottom-bar-commit button";
  _bottomBarPull = ".t--bottom-bar-pull button";
  private _branchName = (branch: string) =>
    "//button[contains(@class, 't--branch-button')]//*[text()='" +
    branch +
    "']";
  _checkMergeability = "//span[contains(text(), 'Checking mergeability')]";
  private _branchListItem = "[data-testid=t--branch-list-item]";
  private _bottomBarMergeButton = ".t--bottom-bar-merge";
  private _mergeBranchDropdownDestination =
    ".t--merge-branch-dropdown-destination";
  private _dropdownmenu = ".rc-select-item-option-content";
  private _openRepoButton = "[data-testid=t--git-repo-button]";
  private _commitButton = ".t--commit-button";
  private _commitCommentInput = ".t--commit-comment-input textarea";

  public _discardChanges = ".t--discard-button";
  public _discardCallout = "[data-testid='t--discard-callout']";

  OpenGitSyncModal() {
    this.agHelper.GetNClick(this._connectGitBottomBar);
    this.agHelper.AssertElementVisible(this._gitSyncModal);
  }

  CloseGitSyncModal() {
    this.agHelper.GetNClick(this._closeGitSyncModal);
    this.agHelper.AssertElementAbsence(this._gitSyncModal);
  }

  CreateNConnectToGit(
    repoName = "Repo",
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

  public CreateTestGiteaRepo(repo: string, privateFlag = false) {
    cy.request({
      method: "POST",
      url: `${this.hostPort.GITEA_API_BASE_TED}:${this.hostPort.GITEA_API_PORT_TED}/api/v1/org/Cypress/repos`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
      body: {
        name: repo,
        private: privateFlag,
      },
    });
  }

  public AuthorizeKeyToGitea(repo: string, assertConnect = true) {
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
      `${this.hostPort.GITEA_API_URL_TED}/${repo}.git`,
      //`git@github.com:${owner}/${repo}.git`,
    );

    this.agHelper.ClickButton("Generate key");

    cy.wait(`@generateKey-${repo}`).then((result: any) => {
      generatedKey = result.response.body.data.publicKey;
      generatedKey = generatedKey.slice(0, generatedKey.length - 1);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `${this.hostPort.GITEA_API_BASE_TED}:${this.hostPort.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repo}/keys`,
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
      this.agHelper.ClickButton("Connect");
      if (assertConnect) {
        this.assertHelper.AssertNetworkStatus("@connectGitLocalRepo");
        this.agHelper.AssertElementExist(this._bottomBarCommit, 0, 30000);
        this.CloseGitSyncModal();
      }
    });
  }

  DeleteTestGithubRepo(repo: any) {
    cy.request({
      method: "DELETE",
      url: `${this.hostPort.GITEA_API_BASE_TED}:${this.hostPort.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repo}`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
    });
  }

  CreateGitBranch(branch = "br", toUseNewGuid = false) {
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
      this.agHelper.AssertElementExist(this.locator._btnSpinner);
      this.agHelper.AssertElementAbsence(this.locator._btnSpinner, 70000); //Since page taking more time to laod in some cases
      this.agHelper.AssertElementVisible(this._branchName(branch + uid));
      this.assertHelper.AssertNetworkStatus("getBranch");
      cy.wrap(branch + uid).as("gitbranchName");
    });
  }

  SwitchGitBranch(branch: string, expectError?: false) {
    this.agHelper.AssertElementExist(this._bottomBarPull);
    this.agHelper.GetNClick(this._branchButton);
    this.agHelper.TypeText(
      this._branchSearchInput,
      `{selectall}` + `${branch}`,
      0,
      true,
    );
    cy.wait(1000);
    //cy.get(gitSyncLocators.branchListItem).contains(branch).click();
    this.agHelper.GetNClickByContains(this._branchListItem, branch);
    if (!expectError) {
      // increasing timeout to reduce flakyness
      cy.get(this.locator._btnSpinner, { timeout: 45000 }).should("exist");
      cy.get(this.locator._btnSpinner, { timeout: 45000 }).should("not.exist");
    }

    this.agHelper.Sleep(2000);
  }

  CheckMergeConflicts(destinationBranch: string) {
    this.agHelper.AssertElementExist(this._bottomBarPull);
    this.agHelper.GetNClick(this._bottomBarMergeButton);
    cy.wait(2000);
    this.agHelper.GetNClick(this._mergeBranchDropdownDestination);
    // cy.get(commonLocators.dropdownmenu).contains(destinationBranch).click();
    this.agHelper.GetNClickByContains(this._dropdownmenu, destinationBranch);

    this.agHelper.AssertElementAbsence(this._checkMergeability, 35000);
  }

  OpenRepositoryAndVerify() {
    this.agHelper.GetNClick(this._openRepoButton);
  }

  CommitAndPush(assertFailure?: true) {
    this.agHelper.GetNClick(this.locator._publishButton);
    this.agHelper.AssertElementExist(this._bottomBarPull);
    //cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    this.agHelper.TypeText(this._commitCommentInput, "Initial commit", 0, true);
    this.agHelper.GetNClick(this._commitButton);
    if (!assertFailure) {
      // check for commit success
      //adding timeout since commit is taking longer sometimes
      cy.wait("@commit", { timeout: 35000 }).should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.wait(3000);
    } else {
      cy.wait("@commit", { timeout: 35000 }).then((interception: any) => {
        const status = interception.response.body.responseMeta.status;
        expect(status).to.be.gte(400);
      });
    }

    this.CloseGitSyncModal();
  }

  public DiscardChanges() {
    this.agHelper.GetNClick(this._bottomBarCommit);
    this.agHelper.AssertElementVisible(this._gitSyncModal);
    this.agHelper.AssertElementVisible(this._discardChanges);
    this.agHelper.ClickButton("Discard & pull");
    this.agHelper.AssertContains(
      Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING(),
    );
    this.agHelper.ClickButton("Are you sure?", 0, false);
    this.agHelper.AssertContains(
      Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES(),
    );
    this.assertHelper.AssertNetworkStatus("@discardChanges");
    this.assertHelper.AssertNetworkStatus("@gitStatus");
    this.agHelper.AssertContains("Discarded changes successfully");
    this.agHelper.AssertElementExist(this._bottomBarCommit, 0, 30000);
  }

  //#region Unused methods

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
      let formdata = new FormData();
      cy.log("generatedKey is " + generatedKey);
      formdata.set("sshkey", generatedKey);
      // fetch the generated key and post to the github repo
      cy.request({
        method: "POST",
        url: `http://${this.hostPort.GITEA_API_BASE_TED}:${this.hostPort.GITEA_API_PORT_TED}/v1/gitserver/addgitssh`,
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
        this.assertHelper.AssertNetworkStatus("@connectGitLocalRepo");
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

  private CreateLocalGithubRepo(repo: string) {
    let remoteUrl = "";
    cy.request({
      method: "GET",
      url:
        `http://${this.hostPort.GITEA_API_BASE_TED}:${this.hostPort.GITEA_API_PORT_TED}/v1/gitserver/addrepo?reponame=` +
        repo,
    }).then((response) => {
      remoteUrl = JSON.stringify(response.body).replace(/['"]+/g, "");
      expect(response.status).to.equal(200);
      //cy.log("remoteUrl is"+ remoteUrl);
      cy.wrap(remoteUrl).as("remoteUrl");
    });
  }

  //#endregion
}
