import { ObjectsRegistry } from "../Objects/Registry";
const GITHUB_API_BASE = "https://api.github.com";
//const GITEA_API_BASE = "http://35.154.225.218";

export class GitSync {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  private dataManager = ObjectsRegistry.DataManager;
  private assertHelper = ObjectsRegistry.AssertHelper;
  private homePage = ObjectsRegistry.HomePage;

  private _connectGitBottomBar = ".t--connect-git-bottom-bar";
  public _gitSyncModal = "[data-testid=t--git-sync-modal]";
  private _closeGitSyncModal =
    "//div[@data-testid='t--git-sync-modal']//button[@aria-label='Close']";
  private _closeGitSettingsModal =
    "//div[@data-testid='t--git-settings-modal']//button[@aria-label='Close']";
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
  public _bottomBarCommit = ".t--bottom-bar-commit button";
  public _gitPullCount = ".t--bottom-bar-commit .count";
  _bottomBarPull = ".t--bottom-bar-pull button";
  private _branchName = (branch: string) =>
    "//button[contains(@class, 't--branch-button')]//*[text()='" +
    branch +
    "']";
  _checkMergeability = "//span[contains(text(), 'Checking mergeability')]";
  public _branchListItem = "[data-testid=t--branch-list-item]";
  public _bottomBarMergeButton = ".t--bottom-bar-merge";
  public _mergeBranchDropdownDestination =
    ".t--merge-branch-dropdown-destination";
  public _dropdownmenu = ".rc-select-item-option-content";
  private _openRepoButton = "[data-testid=t--git-repo-button]";
  public _commitButton = ".t--commit-button";
  private _commitCommentInput = ".t--commit-comment-input textarea";

  public _discardChanges = ".t--discard-button";
  public _discardCallout = "[data-testid='t--discard-callout']";
  public _gitStatusChanges = "[data-testid='t--git-change-statuses']";
  private _gitSyncBranches = ".t--sync-branches";
  learnMoreSshUrl = ".t--learn-more-ssh-url";
  repoLimitExceededErrorModal = ".t--git-repo-limited-modal";
  public _bottomSettingsBtn = ".t--bottom-git-settings";
  public _defaultBranchSelect = "[data-testid='t--git-default-branch-select']";
  public _defaultBranchUpdateBtn =
    "[data-testid='t--git-default-branch-update-btn']";
  public _protectedBranchesSelect =
    "[data-testid='t--git-protected-branches-select']";
  public _protectedBranchesUpdateBtn =
    "[data-testid='t--git-protected-branches-update-btn']";
  public _gitSettingsModal = "[data-testid='t--git-settings-modal']";
  public _settingsTabGeneral = "[data-testid='t--tab-GENERAL']";
  public _settingsTabBranch = "[data-testid='t--tab-BRANCH']";
  public _branchProtectionSelectDropdown =
    "[data-testid='t--git-protected-branches-select']";
  public _branchProtectionUpdateBtn =
    "[data-testid='t--git-protected-branches-update-btn']";
  public _disconnectGitBtn = "[data-testid='t--git-disconnect-btn']";
  public _mergeLoader = "[data-testid='t--git-merge-loader']";

  OpenGitSyncModal() {
    this.agHelper.GetNClick(this._connectGitBottomBar);
    this.agHelper.AssertElementVisibility(this._gitSyncModal);
  }

  CloseGitSyncModal() {
    this.agHelper.GetNClick(this._closeGitSyncModal);
    this.agHelper.AssertElementAbsence(this._gitSyncModal);
  }

  OpenGitSettingsModal(tabName: "GENERAL" | "BRANCH" | "CD" = "GENERAL") {
    this.agHelper.GetNClick(this._bottomSettingsBtn);
    this.agHelper.AssertElementVisibility(this._gitSettingsModal);
    if (tabName !== "GENERAL") {
      this.agHelper.GetNClick(`[data-testid='t--tab-${tabName}']`);
    }
  }

  CloseGitSettingsModal() {
    this.agHelper.GetNClick(this._closeGitSettingsModal);
    this.agHelper.AssertElementAbsence(this._gitSettingsModal);
  }

  GetCurrentBranchName() {
    return this.agHelper.GetText(this._branchButton, "text", 0);
  }

  public CreateTestGiteaRepo(repo: string, privateFlag = false) {
    cy.request({
      method: "POST",
      url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/org/Cypress/repos`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
      body: {
        name: repo,
        private: privateFlag,
      },
    });
  }

  private providerRadioOthers = "[data-testid='t--git-provider-radio-others']";
  private existingEmptyRepoYes = "[data-testid='t--existing-empty-repo-yes']";
  private gitConnectNextBtn = "[data-testid='t--git-connect-next-button']";
  private remoteUrlInput = "[data-testid='git-connect-remote-url-input']";
  private addedDeployKeyCheckbox =
    "[data-testid='t--added-deploy-key-checkbox']";
  private startUsingGitButton =
    "[data-testid='t--git-success-modal-start-using-git-cta']";
  private existingRepoCheckbox = "[data-testid='t--existing-repo-checkbox']";

  CreateNConnectToGit(
    repoName = "Repo",
    assertConnect = true,
    privateFlag = false,
    removeDefaultBranchProtection = true,
  ) {
    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      repoName += uid;
      this.CreateTestGiteaRepo(repoName, privateFlag);

      cy.intercept("POST", "/api/v1/applications/ssh-keypair/*").as(
        `generateKey-${repoName}`,
      );

      cy.intercept("GET", "/api/v1/git/branch/app/*/protected").as(
        `protected-${repoName}`,
      );

      cy.intercept("GET", "/api/v1/git/branch/app/*").as(
        `branches-${repoName}`,
      );

      this.OpenGitSyncModal();

      this.agHelper.GetNClick(this.providerRadioOthers);
      this.agHelper.GetNClick(this.existingEmptyRepoYes);
      this.agHelper.GetNClick(this.gitConnectNextBtn);
      this.agHelper.AssertAttribute(
        this.remoteUrlInput,
        "placeholder",
        "git@example.com:user/repository.git",
      );
      this.agHelper.TypeText(
        this.remoteUrlInput,
        `${this.dataManager.GITEA_API_URL_TED}/${repoName}.git`,
      );
      this.agHelper.GetNClick(this.gitConnectNextBtn);

      this.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        cy.wait(`@generateKey-${repoName}`).then((result: any) => {
          let generatedKey = result.response.body.data.publicKey;
          generatedKey = generatedKey.slice(0, generatedKey.length - 1);
          // fetch the generated key and post to the github repo
          cy.request({
            method: "POST",
            url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repoName}/keys`,
            headers: {
              Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
            },
            body: {
              title: "key_" + uid,
              key: generatedKey,
              read_only: false,
            },
          }).then((resp: any) => {
            cy.log("Deploy Key Id ", resp.body.key_id);
            cy.wrap(resp.body.key_id).as("deployKeyId");
          });
        });
      });
      this.agHelper.GetNClick(this.addedDeployKeyCheckbox, 0, true);
      this.agHelper.GetNClick(this.gitConnectNextBtn);

      if (assertConnect) {
        this.assertHelper.AssertNetworkStatus("@connectGitLocalRepo");
        this.agHelper.GetNClick(this.startUsingGitButton);
        this.agHelper.AssertElementExist(this._bottomBarCommit, 0, 30000);
      }

      if (removeDefaultBranchProtection) {
        cy.wait([`@protected-${repoName}`, `@branches-${repoName}`]).then(
          (interceptions) => {
            if (
              interceptions[0]?.response?.statusCode === 200 &&
              interceptions[1]?.response?.statusCode === 200
            ) {
              this.clearBranchProtection();
            }
          },
        );
      }

      cy.wrap(repoName).as("gitRepoName");
    });
  }

  public ImportAppFromGit(
    workspaceName: string,
    repoName: string,
    assertConnect = true,
  ) {
    cy.intercept("GET", "api/v1/git/import/keys?keyType=ECDSA").as(
      `importKey-${repoName}`,
    );

    this.homePage.ImportGitApp(workspaceName);

    this.agHelper.GetNClick(this.providerRadioOthers);
    this.agHelper.GetNClick(this.existingRepoCheckbox, 0, true);
    this.agHelper.GetNClick(this.gitConnectNextBtn);
    this.agHelper.AssertAttribute(
      this.remoteUrlInput,
      "placeholder",
      "git@example.com:user/repository.git",
    );
    this.agHelper.TypeText(
      this.remoteUrlInput,
      `${this.dataManager.GITEA_API_URL_TED}/${repoName}.git`,
    );
    this.agHelper.GetNClick(this.gitConnectNextBtn);

    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      cy.wait(`@importKey-${repoName}`).then((result: any) => {
        let generatedKey = result.response.body.data.publicKey;
        generatedKey = generatedKey.slice(0, generatedKey.length - 1);
        // fetch the generated key and post to the github repo
        cy.request({
          method: "POST",
          url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repoName}/keys`,
          headers: {
            Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
          },
          body: {
            title: "key_" + uid,
            key: generatedKey,
            read_only: false,
          },
        }).then((resp: any) => {
          cy.log("Deploy Key Id ", resp.body.key_id);
          cy.wrap(resp.body.key_id).as("deployKeyId");
        });
      });
    });
    this.agHelper.GetNClick(this.addedDeployKeyCheckbox, 0, true);
    this.agHelper.GetNClick(this.gitConnectNextBtn);

    if (assertConnect) {
      this.assertHelper.AssertNetworkStatus("@importFromGit", 201);
    }
  }

  public clearBranchProtection() {
    this.agHelper.GetNClick(this._bottomSettingsBtn);
    this.agHelper.GetNClick(this._settingsTabBranch);
    this.agHelper.GetNClick(this._branchProtectionSelectDropdown);
    // const dropdownEl = this.agHelper.GetElement(this._protectedBranchesSelect);
    const selectedOptionsEl = this.agHelper.GetElement(
      ".rc-select-dropdown .rc-select-item-option-active",
    );
    console.log("ss", selectedOptionsEl);
    selectedOptionsEl.each((el) => {
      el.trigger("click");
    });

    this.agHelper.GetNClick(this._branchProtectionUpdateBtn);
    this.agHelper.GetNClick(this._closeGitSettingsModal);
  }

  DeleteTestGithubRepo(repo: any) {
    cy.request({
      method: "DELETE",
      url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repo}`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
    });
  }

  DeleteDeployKey(repo: any, id: number) {
    cy.request({
      method: "DELETE",
      url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repo}/keys/${id}`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
    });
  }

  public CreateRemoteBranch(repo: string, branchName: string) {
    cy.request({
      method: "POST",
      url: `${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/api/v1/repos/Cypress/${repo}/branches`,
      headers: {
        Authorization: `token ${Cypress.env("GITEA_TOKEN")}`,
      },
      body: {
        new_branch_name: branchName,
      },
    });
  }

  CreateGitBranch(
    branch = "br",
    toUseNewGuid = false,
    assertCreateBranch = true,
  ) {
    this.agHelper.AssertElementVisibility(this._bottomBarPull);
    if (toUseNewGuid) this.agHelper.GenerateUUID();
    this.agHelper.AssertElementExist(this._bottomBarCommit);
    cy.waitUntil(
      () => {
        this.agHelper.GetNClick(this._branchButton, 0, true);
        if (this.agHelper.IsElementVisible(this._branchSearchInput)) {
          return true; //visible, return true to stop waiting
        }
        return false; //not visible, return false to continue waiting
      },
      { timeout: Cypress.config("pageLoadTimeout") },
    );

    cy.get("@guid").then((uid) => {
      //using the same uid as generated during CreateNConnectToGit
      this.agHelper.TypeText(
        this._branchSearchInput,
        `{selectall}` + `${branch + uid}` + `{enter}`,
        { parseSpecialCharSeq: true },
      );
      assertCreateBranch &&
        this.assertHelper.AssertNetworkStatus("createBranch", 201);
      this.agHelper.AssertElementAbsence(
        this.locator._specificToast(
          "Unable to import application in workspace",
        ),
      );
      this.agHelper.AssertElementExist(this.locator._btnSpinner);
      this.agHelper.AssertElementAbsence(this.locator._btnSpinner, 70000); //Since page taking more time to laod in some cases
      this.agHelper.AssertElementVisibility(this._branchName(branch + uid));
      this.assertHelper.AssertNetworkStatus("getBranch");
      cy.wrap(branch + uid).as("gitbranchName");
    });
  }

  SwitchGitBranch(branch: string, expectError = false, refreshList = false) {
    this.agHelper.AssertElementExist(this._bottomBarPull);
    this.agHelper.GetNClick(this._branchButton);
    if (refreshList) {
      this.agHelper.GetNClick(this._gitSyncBranches);
    }
    this.agHelper.TypeText(
      this._branchSearchInput,
      `{selectall}` + `${branch}`,
      { parseSpecialCharSeq: true },
    );
    cy.wait(1000);

    // this slows down the checkout api by 1 sec
    cy.intercept(
      {
        method: "GET",
        url: "/api/v1/git/checkout-branch/app/**",
      },
      async (req) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(req.continue()), 1000);
        });
      },
    ).as("gitCheckoutAPI");

    //cy.get(gitSyncLocators.branchListItem).contains(branch).click();
    this.agHelper.GetNClickByContains(this._branchListItem, branch);

    // checks if the spinner exists
    cy.get(`div${this._branchListItem} ${this.locator._btnSpinner}`, {
      timeout: 500,
    }).should("exist");

    cy.wait("@gitCheckoutAPI");

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

  CommitAndPush(assertSuccess = true) {
    this.agHelper.GetNClick(this.locator._publishButton);
    this.agHelper.AssertElementExist(this._bottomBarPull);
    //cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    this.agHelper.TypeText(this._commitCommentInput, "Initial commit");
    this.agHelper.GetNClick(this._commitButton);
    if (assertSuccess) {
      // check for commit success
      //adding timeout since commit is taking longer sometimes
      this.assertHelper.AssertNetworkStatus("@commit", 201);
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
    this.agHelper.AssertElementVisibility(this._gitSyncModal);
    this.agHelper.AssertElementVisibility(this._discardChanges);
    this.agHelper.ClickButton("Discard & pull");
    this.agHelper.AssertContains(
      Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING(),
    );
    this.agHelper.ClickButton("Are you sure?", { waitAfterClick: false });
    this.agHelper.AssertContains(
      Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES(),
    );
    this.agHelper.AssertContains("Discarded changes successfully");
    this.assertHelper.AssertNetworkStatus("@discardChanges");
    this.assertHelper.AssertNetworkStatus("@gitStatus");
    this.agHelper.AssertElementExist(this._bottomBarCommit, 0, 30000);
  }

  public VerifyChangeLog(uncommitedChanges = false) {
    // open gitsync modal and verify no uncommited changes exist
    this.agHelper.GetNClick(this._bottomBarCommit);
    this.agHelper.AssertElementVisibility(this._gitSyncModal);
    if (uncommitedChanges) {
      this.agHelper.AssertElementEnabledDisabled(
        this._commitCommentInput,
        0,
        false,
      );
    } else {
      this.agHelper.AssertElementEnabledDisabled(
        this._commitCommentInput,
        0,
        true,
      );
    }
    this.CloseGitSyncModal();
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
        url: `http://${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/v1/gitserver/addgitssh`,
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
        `http://${this.dataManager.GITEA_API_BASE_TED}:${this.dataManager.GITEA_API_PORT_TED}/v1/gitserver/addrepo?reponame=` +
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
