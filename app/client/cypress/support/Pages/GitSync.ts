import { ObjectsRegistry } from "../Objects/Registry";

//const GITEA_API_BASE = "http://35.154.225.218";
export class GitSync {
  public agHelper = ObjectsRegistry.AggregateHelper;
  private commonLocators = ObjectsRegistry.CommonLocators;
  private dataManager = ObjectsRegistry.DataManager;
  private assertHelper = ObjectsRegistry.AssertHelper;
  private homePage = ObjectsRegistry.HomePage;

  public locators = {
    quickActionConnectBtn: "[data-testid='t--git-quick-actions-connect']",
    quickActionsCommitBtn: "[data-testid='t--git-quick-actions-commit'] button",
    quickActionsCommitCount: "[data-testid='t--git-quick-actions-commit-count']",
    quickActionsPullBtn: "[data-testid='t--git-quick-actions-pull'] button",
    quickActionsBranchBtn: "[data-testid='t--git-quick-actions-branch']",
    quickActionsMergeBtn: "[data-testid='t--git-quick-actions-merge']",
    quickActionsSettingsBtn: "[data-testid='t--git-quick-actions-settings']",
    branchSearchInput: "[data-testid='t--git-branch-search-input'] input",
    branchSyncBtn: "[data-testid='t--git-branch-sync']",
    branchCloseBtn: "[data-testid='t--git-branch-close']",
    branchItem: "[data-testid='t--git-branch-item']",
    branchItemMenu: "[data-testid='t--branch-item-menu']",
    branchItemMenuBtn: "[data-testid='t--branch-item-menu-btn']",
    branchItemMenuDeleteBtn: "[data-testid='t--branch-item-menu-delete']",
    connectModal: "[data-testid='t--git-connect-modal']",
    connectModalCloseBtn:
      "//div[@data-testid='t--git-sync-modal']//button[@aria-label='Close']",
    connectModalNextBtn: "[data-testid='t--git-connect-next']",
    connectProviderRadioOthers:
      "[data-testid='t--git-connect-provider-radio-others']",
    connectEmptyRepoYes: "[data-testid='t--git-connect-empty-repo-yes']",
    connectRemoteInput: "[data-testid='t--git-connect-remote-input']",
    connectDeployKeyCheckbox:
      "[data-testid='t--git-connect-deploy-key-checkbox']",
    importExistingRepoCheckbox:
      "[data-testid='t--git-import-existing-repo-checkbox']",
    disconnectModal: "[data-testid='t--git-disconnect-modal']",
    disconnectModalCloseBtn: "//div[@data-testid='t--git-disconnect-modal']//button[@aria-label='Close']",
    disconnectModalInput: "[data-testid='t--git-disconnect-modal-input']",
    disconnectModalBackBtn: "[data-testid='t--git-disconnect-modal-back-btn']",
    disconnectModalRevokeBtn:
      "[data-testid='t--git-disconnect-modal-revoke-btn']",
    disconnectModalLearnMoreLink: "[data-testid='t--git-disconnect-learn-more']",
    connectSuccessModal: "[data-testid='t--git-con-success-modal']",
    connectSuccessModalCloseBtn:
      "//div[@data-testid='t--git-success-modal']//button[@aria-label='Close']",
    connectSuccessStartUsingBtn:
      "[data-testid='t--git-con-success-start-using']",
    connectSuccessOpenSettingsBtn:
      "[data-testid='t--git-con-success-open-settings']",
    disconnectBtn: "[data-testid='t--git-disconnect-btn']",
    settingsModal: "[data-testid='t--git-settings-modal']",
    settingsModalCloseBtn:
      "//div[@data-testid='t--git-settings-modal']//button[@aria-label='Close']",
    settingsModalTabGeneral: "[data-testid='t--git-settings-tab-general']",
    settingsModalTabBranch: "[data-testid='t--git-settings-tab-branch']",
    settingsModalTabCD: "[data-testid='t--git-settings-tab-cd']",
    opsModal: "[data-testid='t--git-ops-modal']",
    opsModalTabDeploy: "[data-testid='t--git-ops-tab-deploy']",
    opsModalTabMerge: "[data-testid='t--git-ops-tab-merge']",
    opsModalCloseBtn:
      "//div[@data-testid='t--git-ops-modal']//button[@aria-label='Close']",
    opsCommitInput: "[data-testid='t--git-ops-commit-input']",
    opsCommitBtn: "[data-testid='t--git-ops-commit-btn']",
    opsDiscardBtn: "[data-testid='t--git-ops-discard-btn']",
    opsDiscardWarningCallout:
      "[data-testid='t--git-ops-discard-warning-callout']",
    opsPullBtn: "[data-testid='t--git-ops-pull-btn']",
    opsMergeBranchSelect: "[data-testid='t--git-ops-merge-branch-select']",
    opsMergeBranchSelectMenu:
      "[data-testid='t--git-ops-merge-branch-select'] .rc-select-selection-search-input",
    opsMergeLoader: "[data-testid='t--git-ops-merge-loader']",
    opsMergeStatus: "[data-testid='t--git-ops-merge-status']",
    opsMergeBtn: "[data-testid='t--git-ops-merge-button']",
    branchProtectionSelect: "[data-testid='t--git-branch-protection-select']",
    branchProtectionUpdateBtn:
      "[data-testid='t--git-branch-protection-update-btn']",
    status: "[data-testid='t--git-status']",
    autocommitLoader: "[data-testid='t--git-autocommit-loader']",
    conflictErrorOpenRepo: "[data-testid='t--git-conflict-error-open-repo']",
    repoLimitErrorModal: "[data-testid='t--git-repo-limit-error-modal']",
    deployMenuConnect: "[data-testid='t--git-deploy-menu-connect']",
  };

  public OpenConnectModal() {
    this.agHelper.GetNClick(this.locators.quickActionConnectBtn);
    this.agHelper.AssertElementVisibility(this.locators.connectModal);
  }

  public CloseConnectModal() {
    this.agHelper.GetNClick(this.locators.connectModalCloseBtn);
    this.agHelper.AssertElementAbsence(this.locators.connectModal);
  }

  public OpenOpsModal() {
    this.agHelper.GetNClick(this.locators.opsModal);
    this.agHelper.AssertElementVisibility(this.locators.opsModal);
  }

  public CloseOpsModal() {
    this.agHelper.GetNClick(this.locators.opsModalCloseBtn);
    this.agHelper.AssertElementAbsence(this.locators.opsModal);
  }

  public OpenSettingsModal(tab: "GENERAL" | "BRANCH" | "CD" = "GENERAL") {
    this.agHelper.GetNClick(this.locators.quickActionsSettingsBtn);
    this.agHelper.AssertElementVisibility(this.locators.settingsModal);
    const lookup = {
      GENERAL: this.locators.settingsModalTabGeneral,
      BRANCH: this.locators.settingsModalTabBranch,
      CD: this.locators.settingsModalTabCD,
    };
    const tabSelector = lookup[tab];
    if (tabSelector) {
      this.agHelper.AssertElementExist(tabSelector);
      this.agHelper.GetNClick(tabSelector);
    }
  }

  public CloseGitSettingsModal() {
    this.agHelper.GetNClick(this.locators.settingsModalCloseBtn);
    this.agHelper.AssertElementAbsence(this.locators.settingsModal);
  }

  public CreateTestGiteaRepo(repo: string, privateFlag = false) {
    cy.request({
      method: "POST",
      url: `${this.dataManager.GIT_API_BASE}/api/v1/git/repos`,
      body: {
        name: repo,
        private: privateFlag,
      },
    });
  }

  public DeleteTestGithubRepo(repo: any) {
    cy.request({
      method: "DELETE",
      url: `${this.dataManager.GIT_API_BASE}/api/v1/git/repos/${repo}`,
    });
  }

  public DeleteDeployKey(repo: any, id: number) {
    cy.request({
      method: "DELETE",
      url: `${this.dataManager.GIT_API_BASE}/api/v1/git/keys/${id}`,
    });
  }

  public CreateNConnectToGit(
    repoName = "Repo",
    assertConnect = true,
    privateFlag = false,
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

      this.OpenConnectModal();

      this.agHelper.GetNClick(this.locators.connectProviderRadioOthers);
      this.agHelper.GetNClick(this.locators.connectEmptyRepoYes);
      this.agHelper.GetNClick(this.locators.connectModalNextBtn);
      this.agHelper.AssertAttribute(
        this.locators.connectRemoteInput,
        "placeholder",
        "git@example.com:user/repository.git",
      );
      this.agHelper.TypeText(
        this.locators.connectRemoteInput,
        `${this.dataManager.GIT_CLONE_URL}/${repoName}.git`,
      );
      this.agHelper.GetNClick(this.locators.connectModalNextBtn);

      this.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        cy.wait(`@generateKey-${repoName}`).then((result: any) => {
          let generatedKey = result.response.body.data.publicKey;
          // fetch the generated key and post to the github repo
          cy.request({
            method: "POST",
            url: `${this.dataManager.GIT_API_BASE}/api/v1/git/keys/${repoName}`,
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
      this.agHelper.GetNClick(this.locators.connectDeployKeyCheckbox, 0, true);
      this.agHelper.GetNClick(this.locators.connectModalNextBtn);

      if (assertConnect) {
        this.assertHelper.AssertNetworkStatus("@connectGitLocalRepo");
        this.agHelper.GetNClick(this.locators.connectSuccessStartUsingBtn);
        this.agHelper.AssertElementExist(
          this.locators.quickActionsCommitBtn,
          0,
          30000,
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

    this.agHelper.GetNClick(this.locators.connectProviderRadioOthers);
    this.agHelper.GetNClick(this.locators.importExistingRepoCheckbox, 0, true);
    this.agHelper.GetNClick(this.locators.connectModalNextBtn);
    this.agHelper.AssertAttribute(
      this.locators.connectRemoteInput,
      "placeholder",
      "git@example.com:user/repository.git",
    );
    this.agHelper.TypeText(
      this.locators.connectRemoteInput,
      `${this.dataManager.GIT_CLONE_URL}/${repoName}.git`,
    );
    this.agHelper.GetNClick(this.locators.connectModalNextBtn);

    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      cy.wait(`@importKey-${repoName}`).then((result: any) => {
        let generatedKey = result.response.body.data.publicKey;
        generatedKey = generatedKey.slice(0, generatedKey.length - 1);
        // fetch the generated key and post to the github repo
        cy.request({
          method: "POST",
          url: `${this.dataManager.GIT_API_BASE}/api/v1/git/keys/${repoName}`,
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
    this.agHelper.GetNClick(this.locators.connectDeployKeyCheckbox, 0, true);
    this.agHelper.GetNClick(this.locators.connectModalNextBtn);

    if (assertConnect) {
      this.assertHelper.AssertNetworkStatus("@importFromGit", 201);
    }
  }

  public CreateGitBranch(
    branch = "br",
    toUseNewGuid = false,
    assertCreateBranch = true,
  ) {
    this.agHelper.AssertElementVisibility(this.locators.quickActionsPullBtn);
    if (toUseNewGuid) this.agHelper.GenerateUUID();
    this.agHelper.AssertElementExist(this.locators.quickActionsCommitBtn);
    cy.waitUntil(
      () => {
        this.agHelper.GetNClick(this.locators.quickActionsBranchBtn, 0, true);
        if (this.agHelper.IsElementVisible(this.locators.branchSearchInput)) {
          return true; //visible, return true to stop waiting
        }
        return false; //not visible, return false to continue waiting
      },
      { timeout: Cypress.config("pageLoadTimeout") },
    );

    cy.get("@guid").then((uid) => {
      //using the same uid as generated during CreateNConnectToGit
      this.agHelper.TypeText(
        this.locators.branchSearchInput,
        `{selectall}` + `${branch + uid}` + `{enter}`,
        { parseSpecialCharSeq: true },
      );
      assertCreateBranch &&
        this.assertHelper.AssertNetworkStatus("createBranch", 201);
      this.agHelper.AssertElementAbsence(
        this.commonLocators._specificToast(
          Cypress.env("MESSAGES").UNABLE_TO_IMPORT_APP(),
        ),
      );
      this.agHelper.WaitUntilEleAppear(this.locators.quickActionsBranchBtn);
      this.agHelper.AssertElementVisibility(
        this.locators.quickActionsBranchBtn,
      );
      this.agHelper.GetNAssertContains(
        this.locators.quickActionsBranchBtn,
        branch + uid,
      );
      this.assertHelper.AssertNetworkStatus("getBranch");
      cy.wrap(branch + uid).as("gitbranchName");
    });
  }

  public SwitchGitBranch(
    branch: string,
    expectError = false,
    refreshList = false,
  ) {
    this.agHelper.AssertElementExist(this.locators.quickActionsPullBtn);
    this.agHelper.GetNClick(this.locators.quickActionsBranchBtn);
    if (refreshList) {
      this.agHelper.GetNClick(this.locators.branchSyncBtn);
    }
    this.agHelper.TypeText(
      this.locators.branchSearchInput,
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

    //cy.get(gitSync.locators.branchItem).contains(branch).click();
    this.agHelper.GetNClickByContains(this.locators.branchItem, branch);

    // checks if the spinner exists
    cy.get(
      `div${this.locators.branchItem} ${this.commonLocators._btnSpinner}`,
      {
        timeout: 500,
      },
    ).should("exist");

    cy.wait("@gitCheckoutAPI");

    if (!expectError) {
      // increasing timeout to reduce flakyness
      cy.get(this.commonLocators._btnSpinner, { timeout: 45000 }).should(
        "exist",
      );
      cy.get(this.commonLocators._btnSpinner, { timeout: 45000 }).should(
        "not.exist",
      );
    }

    this.agHelper.Sleep(2000);
  }

  public CreateRemoteBranch(repo: string, branchName: string) {
    cy.request({
      method: "POST",
      url: `${this.dataManager.GIT_API_BASE}/api/v1/git/repos/${repo}/branches`,
      body: {
        new_branch_name: branchName,
      },
    });
  }

  public GetCurrentBranchName() {
    return this.agHelper.GetText(
      this.locators.quickActionsBranchBtn,
      "text",
      0,
    );
  }

  public AssertBranchName(branch: string) {
    this.agHelper.AssertElementVisibility(this.locators.quickActionsBranchBtn);
    this.agHelper.AssertContains(branch);
  }

  public CommitAndPush(assertSuccess = true) {
    this.agHelper.GetNClick(this.commonLocators._publishButton);
    this.agHelper.AssertElementExist(this.locators.quickActionsPullBtn);
    this.agHelper.TypeText(this.locators.opsCommitInput, "Initial commit");
    this.agHelper.GetNClick(this.locators.opsCommitBtn);
    if (assertSuccess) {
      this.assertHelper.AssertNetworkStatus("@commit", 201);
      cy.wait(3000);
    } else {
      cy.wait("@commit", { timeout: 35000 }).then((interception: any) => {
        const status = interception.response.body.responseMeta.status;
        expect(status).to.be.gte(400);
      });
    }

    this.CloseOpsModal();
  }

  public ClearBranchProtection() {
    this.OpenSettingsModal("BRANCH");
    this.agHelper.GetNClick(this.locators.branchProtectionSelect);
    const selectedOptionsEl = this.agHelper.GetElement(
      ".rc-select-dropdown .rc-select-item-option-active",
    );
    selectedOptionsEl.each((el) => {
      el.trigger("click");
    });

    this.agHelper.GetNClick(this.locators.branchProtectionUpdateBtn);
    this.CloseGitSettingsModal();
  }

  public AssertAbsenceOfCheckingMergeability() {
    this.agHelper.GetNAssertContains(
      this.locators.opsMergeStatus,
      "Checking mergeability",
      "not.exist",
    );
  }

  public CheckMergeConflicts(destinationBranch: string) {
    this.agHelper.AssertElementExist(this.locators.quickActionsPullBtn);
    this.agHelper.GetNClick(this.locators.quickActionsMergeBtn);
    this.agHelper.WaitUntilEleAppear(this.locators.opsMergeBranchSelectMenu);
    this.agHelper.WaitUntilEleDisappear(this.locators.opsMergeLoader);
    this.assertHelper.AssertNetworkStatus("@getBranch", 200);
    this.agHelper.WaitUntilEleAppear(this.locators.opsMergeBranchSelectMenu);
    this.agHelper.GetNClick(this.locators.opsMergeBranchSelectMenu, 0, true);
    this.agHelper.AssertContains(destinationBranch);
    this.agHelper.GetNClickByContains(
      ".rc-select-item-option-content",
      destinationBranch,
    );
    this.AssertAbsenceOfCheckingMergeability();
  }

  public MergeToMaster() {
    this.CheckMergeConflicts("master");
    this.agHelper.AssertElementEnabledDisabled(
      this.locators.opsMergeBtn,
      0,
      false,
    );
    this.agHelper.GetNClick(this.locators.opsMergeBtn);
    this.assertHelper.AssertNetworkStatus("@mergeBranch");
    this.agHelper.AssertContains(
      Cypress.env("MESSAGES").MERGED_SUCCESSFULLY(),
      "be.visible",
    );
    this.CloseOpsModal();
  }

  public OpenRepositoryAndVerify() {
    this.agHelper.GetNClick(this.locators.conflictErrorOpenRepo);
  }

  public DiscardChanges() {
    this.agHelper.GetNClick(this.locators.quickActionsCommitBtn);
    this.agHelper.AssertElementVisibility(this.locators.opsModal);
    this.agHelper.AssertElementVisibility(this.locators.opsDiscardBtn);
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
    this.agHelper.AssertElementExist(
      this.locators.quickActionsCommitBtn,
      0,
      30000,
    );
  }

  public VerifyChangeLog(uncommitedChanges = false) {
    this.agHelper.GetNClick(this.locators.quickActionsCommitBtn);
    this.agHelper.AssertElementVisibility(this.locators.opsModal);
    if (uncommitedChanges) {
      this.agHelper.AssertElementEnabledDisabled(
        this.locators.opsCommitInput,
        0,
        false,
      );
    } else {
      this.agHelper.AssertElementEnabledDisabled(
        this.locators.opsCommitInput,
        0,
        true,
      );
    }
    this.CloseOpsModal();
  }

  public AssertBranchNameInUrl(branch: string) {
    cy.location("search")
      .then((searchParams) => new URLSearchParams(searchParams))
      .invoke("get", "branch")
      .should("equal", branch);
  }
}
