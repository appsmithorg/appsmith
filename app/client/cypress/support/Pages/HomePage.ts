import { ObjectsRegistry } from "../Objects/Registry";
import { REPO, CURRENT_REPO } from "../../fixtures/REPO";
import HomePageLocators from "../../locators/HomePage";
export class HomePage {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;
  private entityExplorer = ObjectsRegistry.EntityExplorer;
  private onboarding = ObjectsRegistry.Onboarding;
  private assertHelper = ObjectsRegistry.AssertHelper;

  private _inviteButton = ".t--invite-user-btn";
  private _username = "input[name='username']";
  private _password = "input[name='password']";
  private _submitBtn = "button[type='submit']";
  private _workspaceCompleteSection = ".t--workspace-section";
  private _workspaceName = ".t--workspace-name";
  private _workspaceNameText = ".t--workspace-name-text";
  private _optionsIcon = ".t--options-icon";
  private _optionsIconInWorkspace = (workspaceName: string) =>
    "//span[text()='" +
    workspaceName +
    "']/ancestor::div[contains(@class, 't--workspace-section')]//button[contains(@class, 't--options-icon')]";
  private _renameWorkspaceContainer = ".editable-text-container";
  private _renameWorkspaceInput = ".t--workspace-rename-input input";
  private _workspaceList = (workspaceName: string) =>
    ".t--workspace-section:contains(" + workspaceName + ")";
  private _workspaceShareUsersIcon = (workspaceName: string) =>
    ".t--workspace-section:contains(" + workspaceName + ") .ads-v2-avatar";
  _shareWorkspace = (workspaceName: string) =>
    ".t--workspace-section:contains(" +
    workspaceName +
    ") button:contains('Share')";
  private _email =
    CURRENT_REPO === REPO.CE
      ? "//input[@type='email' and contains(@class,'bp3-input-ghost')]"
      : "//input[@type='text' and contains(@class,'bp3-input-ghost')]";
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  _newWorkSpaceLink = this._visibleTextSpan("New workspace") + "/ancestor::a";
  private _userRole = (role: string) =>
    "//div[contains(@class, 'rc-select-item-option-content')]//span[1][text()='" +
    role +
    "']";
  private _profileMenu = ".t--profile-menu-icon";
  private _editProfileMenu = ".t--edit-profile";
  private _signout = ".t--sign-out";
  _searchUsersInput = ".search-input";

  private _manageUsers = ".manageUsers";
  public _closeBtn = ".ads-v2-modal__content-header-close-button";
  private _appHome = "//a[@href='/applications']";
  _applicationCard = ".t--application-card";
  _appEditIcon = ".t--application-edit-link";
  _homeIcon = ".t--appsmith-logo";
  private _homeAppsmithImage = "a.t--appsmith-logo";
  private _appContainer = ".t--applications-container";
  _homePageAppCreateBtn = this._appContainer + " .createnew";
  private _existingWorkspaceCreateNewApp = (existingWorkspaceName: string) =>
    `//span[text()='${existingWorkspaceName}']/ancestor::div[contains(@class, 't--workspace-section')]//button[contains(@class, 't--new-button')]`;
  _applicationName = ".t--application-name";
  private _editAppName = "bp3-editable-text-editing";
  private _appMenu = ".ads-v2-menu__menu-item-children";
  _buildFromDataTableActionCard = "[data-testid='generate-app']";
  private _selectRole = "//span[text()='Select a role']/ancestor::div";
  private _searchInput = "input[type='text']";
  _appHoverIcon = (action: string) => ".t--application-" + action + "-link";
  private _deleteUser = (email: string) =>
    "//td[text()='" +
    email +
    "']/following-sibling::td//span[contains(@class, 't--deleteUser')]";
  private _userRoleDropDown = (role: string) => "//span[text()='" + role + "']";
  //private _userRoleDropDown = (email: string) => "//td[text()='" + email + "']/following-sibling::td"
  private _leaveWorkspaceConfirmModal = ".t--member-delete-confirmation-modal";
  private _workspaceImportAppModal = ".t--import-application-modal";
  private _leaveWorkspaceConfirmButton =
    "[data-testid=t--workspace-leave-button]";
  private _lastWorkspaceInHomePage =
    "//div[contains(@class, 't--workspace-section')][last()]//span/span";
  private _leaveWorkspace = "//span[text()='Leave workspace']";
  private _leaveWorkspaceConfirm = "//span[text()='Are you sure?']";
  _editPageLanding = "//h2[text()='Drag and drop a widget here']";
  _usersEmailList = "[data-colindex='0']";
  private _workspaceImport = "[data-testid=t--workspace-import-app]";
  private _uploadFile = "//div/form/input";
  private _importSuccessModal = ".t--import-app-success-modal";
  private _forkModal = ".fork-modal";
  private _importSuccessModalGotit = ".t--import-success-modal-got-it";
  private _appCard = (applicationName: string) =>
    "//span[text()='" +
    applicationName +
    "']/ancestor::div[contains(@class, 't--application-card')]";
  private _applicationContextMenu = (applicationName: string) =>
    this._appCard(applicationName) + "//button[@aria-haspopup='menu']";
  private _forkApp = '[data-testid="t--fork-app"]';
  private _deleteApp = '[data-testid="t--delete-confirm"]';
  private _deleteAppConfirm = '[data-testid="t--delete"]';
  private _wsAction = (action: string) =>
    ".ads-v2-menu__menu-item-children:contains('" + action + "')";
  private _homeTab = ".t--apps-tab";
  private _workSpaceByName = (wsName: string) =>
    `//div[contains(@class, 't--applications-container')]//span[text()='${wsName}']`;
  private _forkWorkspaceDropdownOption = "div.rc-select-selector";
  private _forkWorkspaceSelectOptions = (option: string) =>
    "div[title='" + option + "']";
  _welcomeTour = ".t--welcome-tour";
  _welcomeTourBuildingButton = ".t--start-building";
  _reconnectDataSourceModal = "[data-testid='reconnect-datasource-modal']";
  _skiptoApplicationBtn = "//span[text()='Skip to Application']/parent::a";
  _workspaceSettingOption = "[data-testid=t--workspace-setting]";
  _inviteUserMembersPage = "[data-testid=t--page-header-input]";
  // _appRenameTooltip =
  //   '//span[text()="Rename application"]/ancestor::div[contains(@class,"rc-tooltip")]';
  _appRenameTooltip = "span:contains('Rename application')";

  public SwitchToAppsTab() {
    this.agHelper.GetNClick(this._homeTab);
  }

  public CreateNewWorkspace(workspaceNewName: string) {
    let oldName = "";
    this.agHelper.GetNClick(this._newWorkSpaceLink);
    this.assertHelper.AssertNetworkStatus("createWorkspace", 201);
    this.agHelper.Sleep(2000);
    cy.xpath(this._lastWorkspaceInHomePage)
      .first()
      .then(($ele) => {
        oldName = $ele.text();
        cy.log("oldName is : " + oldName);
        this.RenameWorkspace(oldName, workspaceNewName);
      });
  }

  public OpenWorkspaceOptions(workspaceName: string) {
    this.agHelper
      .GetElement(this._workSpaceByName(workspaceName))
      .last()
      .closest(this._workspaceCompleteSection)
      .scrollIntoView()
      .wait(1000) ///for scroll to finish & element to come to view
      .find(this._optionsIcon)
      .click({ force: true });
  }

  public OpenWorkspaceSettings(workspaceName: string) {
    this.OpenWorkspaceOptions(workspaceName);
    this.agHelper.GetNClick(this._workspaceSettingOption);
  }

  public RenameWorkspace(oldName: string, newWorkspaceName: string) {
    this.OpenWorkspaceOptions(oldName);
    this.agHelper.GetNClick(this._renameWorkspaceContainer, 0, true);
    this.agHelper.TypeText(this._renameWorkspaceInput, newWorkspaceName).blur();
    this.agHelper.Sleep(2000);
    this.assertHelper.AssertNetworkStatus("@updateWorkspace");
    this.agHelper.AssertContains(newWorkspaceName);
  }

  //Maps to CheckShareIcon in command.js
  public CheckWorkspaceShareUsersCount(workspaceName: string, count: number) {
    cy.get(this._workspaceList(workspaceName))
      .scrollIntoView()
      .should("be.visible");
    cy.get(this._workspaceShareUsersIcon(workspaceName)).should(
      "have.length",
      count,
    );
  }

  //Maps to inviteUserForWorkspace in command.js
  public InviteUserToWorkspace(
    workspaceName: string,
    email: string,
    role: string,
  ) {
    const successMessage =
      CURRENT_REPO === REPO.CE
        ? "The user has been invited successfully"
        : "The user/group have been invited successfully";
    this.StubPostHeaderReq();
    this.agHelper.AssertElementVisible(this._workspaceList(workspaceName));
    this.agHelper.GetNClick(this._shareWorkspace(workspaceName), 0, true);
    this.agHelper.AssertElementExist(
      "//span[text()='Users will have access to all applications in this workspace']",
    );
    cy.xpath(this._email).click({ force: true }).type(email);
    cy.xpath(this._selectRole).first().click({ force: true });
    this.agHelper.Sleep(500);
    cy.xpath(this._userRole(role)).click({ force: true });
    this.agHelper.GetNClick(this._inviteButton, 0, true);
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    this.agHelper.ValidateToastMessage(successMessage);
  }

  public InviteUserToWorkspaceErrorMessage(
    workspaceName: string,
    text: string,
  ) {
    const errorMessage =
      CURRENT_REPO === REPO.CE
        ? "Invalid email address(es) found"
        : "Invalid email address(es) or group(s) found";
    this.StubPostHeaderReq();
    this.agHelper.AssertElementVisible(this._workspaceList(workspaceName));
    this.agHelper.GetNClick(this._shareWorkspace(workspaceName), 0, true);
    cy.xpath(this._email).click({ force: true }).type(text);
    this.agHelper.GetNClick(this._inviteButton, 0, true);
    cy.contains(text, { matchCase: false });
    cy.contains(errorMessage, { matchCase: false });
    cy.get(".ads-v2-modal__content-header-close-button").click({ force: true });
  }

  public StubPostHeaderReq() {
    cy.intercept("POST", "/api/v1/users/invite", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("mockPostInvite");
    cy.intercept("POST", "/api/v1/applications/invite", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("mockPostAppInvite");
  }

  public NavigateToHome() {
    cy.get(this._homeIcon).click({ force: true });
    this.agHelper.Sleep(2000);
    if (!Cypress.env("AIRGAPPED")) {
      this.assertHelper.AssertNetworkStatus("@getReleaseItems");
    } else {
      this.agHelper.Sleep(2000);
    }
    //cy.wait("@applications"); this randomly fails & introduces flakyness hence commenting!
    this.agHelper.AssertElementVisible(this._homeAppsmithImage);
  }

  public CreateNewApplication(skipSignposting = true) {
    cy.get(this._homePageAppCreateBtn).first().click({ force: true });
    this.assertHelper.AssertNetworkStatus("@createNewApplication", 201);
    cy.get(this.locator._loading).should("not.exist");

    if (skipSignposting) {
      this.agHelper.AssertElementVisible(this.entityExplorer._entityExplorer);
      this.onboarding.closeIntroModal();
    }
    this.assertHelper.AssertNetworkStatus("getWorkspace");
  }

  //Maps to CreateAppForWorkspace in command.js
  public CreateAppInWorkspace(workspaceName: string, appname = "") {
    cy.xpath(this._existingWorkspaceCreateNewApp(workspaceName))
      .scrollIntoView()
      .should("be.visible")
      .click({ force: true });
    this.assertHelper.AssertNetworkStatus("@createNewApplication", 201);
    cy.get(this.locator._loading).should("not.exist");
    this.agHelper.Sleep(2000);
    if (appname) this.RenameApplication(appname);
    //this.assertHelper.AssertNetworkStatus("@updateApplication", 200);
  }

  //Maps to AppSetupForRename in command.js
  public RenameApplication(appName: string) {
    this.onboarding.closeIntroModal();
    cy.get(this._applicationName).then(($appName) => {
      if (!$appName.hasClass(this._editAppName)) {
        cy.get(this._applicationName).click();
        cy.get(this._appMenu)
          .contains("Edit name", { matchCase: false })
          .click();
      }
    });
    cy.get(this._applicationName).type(appName + "{enter}");
    this.agHelper.RemoveTooltip("Rename application");
  }

  public GetAppName() {
    return this.agHelper.GetText(this._applicationName, "text");
  }

  //Maps to LogOut in command.js
  public LogOutviaAPI() {
    cy.request({
      method: "POST",
      url: "/api/v1/logout",
      headers: {
        "X-Requested-By": "Appsmith",
      },
    });
    this.agHelper.Sleep(2000); //for logout to complete - CI!
  }

  public Signout(toNavigateToHome = true) {
    if (toNavigateToHome) this.NavigateToHome();
    this.agHelper.GetNClick(this._profileMenu);
    this.agHelper.GetNClick(this._signout);
    this.assertHelper.AssertNetworkStatus("@postLogout");
    return this.agHelper.Sleep(); //for logout to complete!
  }

  public GotoProfileMenu() {
    this.agHelper.GetNClick(this._profileMenu);
  }

  public GotoEditProfile() {
    cy.location().then((loc) => {
      if (loc.pathname !== "/profile") {
        this.NavigateToHome();
        this.GotoProfileMenu();
        this.agHelper.GetNClick(this._editProfileMenu);
      }
    });
  }

  public LogintoApp(
    uname: string,
    pswd: string,
    role: "App Viewer" | "Developer" | "Administrator" = "Administrator",
  ) {
    this.agHelper.Sleep(); //waiting for window to load
    cy.window().its("store").invoke("dispatch", { type: "LOGOUT_USER_INIT" });
    cy.wait("@postLogout");
    this.agHelper.VisitNAssert("/user/login", "signUpLogin");
    cy.get(this._username).should("be.visible").type(uname);
    cy.get(this._password).type(pswd, { log: false });
    cy.get(this._submitBtn).click();
    cy.wait("@getMe");
    this.agHelper.Sleep(3000);
    if (role != "App Viewer")
      cy.get(this._homePageAppCreateBtn)
        .should("be.visible")
        .should("be.enabled");
  }

  public FilterApplication(appName: string, workspaceId?: string) {
    cy.get(this._searchInput).type(appName, { force: true });
    this.agHelper.Sleep(2000);
    workspaceId && cy.get(this._appContainer).contains(workspaceId);
    cy.xpath(this.locator._spanButton("Share")).first().should("be.visible");
  }

  //Maps to launchApp in command.js
  public LaunchAppFromAppHover() {
    cy.get(this._appHoverIcon("view")).should("be.visible").first().click();
    this.agHelper.AssertElementAbsence(this.locator._loading);
    this.assertHelper.AssertNetworkStatus("getPagesForViewApp");
  }

  public EditAppFromAppHover() {
    cy.get(this._applicationCard).first().trigger("mouseover");
    this.agHelper.GetNClick(this._appHoverIcon("edit"));
    this.agHelper.AssertElementAbsence(this.locator._loading);
    this.assertHelper.AssertNetworkStatus("getWorkspace");
  }

  //Maps to deleteUserFromWorkspace in command.js
  public DeleteUserFromWorkspace(
    appName: string,
    workspaceName: string,
    email: string,
  ) {
    cy.get(this._workspaceList(workspaceName))
      .scrollIntoView()
      .should("be.visible");
    this.FilterApplication(appName, workspaceName);
    this.agHelper.GetNClick(this._optionsIcon).click({ force: true });
    cy.xpath(this._visibleTextSpan("Members")).click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    this.agHelper.UpdateInput(this._searchUsersInput, email);
    cy.wait(2000);
    cy.get(HomePageLocators.DeleteBtn).first().click({ force: true });
    cy.get(this._leaveWorkspaceConfirmModal).should("be.visible");
    cy.get(this._leaveWorkspaceConfirmButton).click({ force: true });
    cy.wait(4000);
  }

  public OpenMembersPageForWorkspace(workspaceName: string) {
    cy.get(this._appContainer)
      .contains(workspaceName)
      .scrollIntoView()
      .should("be.visible");
    cy.get(this._appContainer)
      .contains(workspaceName)
      .closest(this._workspaceCompleteSection)
      .find(this._optionsIcon)
      .click({ force: true });

    cy.xpath(this._visibleTextSpan("Members")).last().click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    this.agHelper.Sleep(2500);
    //wait for members page to load!
  }

  public UpdateUserRoleInWorkspace(
    workspaceName: string,
    email: string,
    currentRole: string,
    newRole: string,
  ) {
    this.OpenMembersPageForWorkspace(workspaceName);
    cy.log(workspaceName, email, currentRole);
    this.agHelper.UpdateInput(this._searchUsersInput, email);
    cy.get(".search-highlight").should("exist").contains(email);
    this.agHelper.Sleep(2000);
    cy.xpath(this._userRoleDropDown(currentRole))
      .first()
      .click({ force: true });
    this.agHelper.Sleep();
    //cy.xpath(this._userRoleDropDown(email)).first().click({force: true});
    if (CURRENT_REPO === REPO.EE) {
      this.agHelper.AssertElementExist(
        this._visibleTextSpan("Assign Custom Role"),
      );
    }
    cy.xpath(this._visibleTextSpan(`${newRole}`))
      .last()
      .parent("div")
      .click();
    this.agHelper.Sleep();
    this.agHelper.AssertElementVisible(this._userRoleDropDown(newRole));
    this.NavigateToHome();
  }

  public ImportApp(fixtureJson: string, intoWorkspaceName = "") {
    cy.get(this._homeIcon).click({ force: true });
    if (intoWorkspaceName)
      this.agHelper.GetNClick(this._optionsIconInWorkspace(intoWorkspaceName));
    else this.agHelper.GetNClick(this._optionsIcon);
    this.agHelper.GetNClick(this._workspaceImport, 0, true);
    this.agHelper.AssertElementVisible(this._workspaceImportAppModal);
    cy.xpath(this._uploadFile).selectFile("cypress/fixtures/" + fixtureJson, {
      force: true,
    });
    this.agHelper.Sleep(3500);
  }

  // Do not use this directly, it will fail on EE. Use `InviteUserToApplication` instead
  private InviteUserToWorkspaceFromApp(
    email: string,
    role: string,
    validate = true,
  ) {
    const successMessage =
      CURRENT_REPO === REPO.CE
        ? "The user has been invited successfully"
        : "The user/group have been invited successfully";
    this.StubPostHeaderReq();
    this.agHelper.AssertElementExist(
      "//span[text()='Users will have access to all applications in the workspace. For application-level access, try out our ']",
    );
    this.agHelper.AssertElementExist("//span[text()='business edition']");
    cy.xpath(this._email).click({ force: true }).type(email);
    cy.xpath(this._selectRole).first().click({ force: true });
    this.agHelper.Sleep(500);
    cy.xpath(this._userRole(role)).click({ force: true });
    this.agHelper.GetNClick(this._inviteButton, 0, true);
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    // cy.contains(email, { matchCase: false });
    if (validate) {
      cy.contains(successMessage);
    }
  }

  public InviteUserToApplicationFromApp(email: string, role: string) {
    const successMessage = "The user/group have been invited successfully";
    this.StubPostHeaderReq();
    this.agHelper.AssertElementExist(
      "//span[text()='Users will only have access to this application']",
    );
    cy.xpath(this._email).click({ force: true }).type(email);
    cy.xpath(this._selectRole).first().click({ force: true });
    this.agHelper.Sleep(500);
    cy.xpath(this._userRole(role)).click({ force: true });
    this.agHelper.GetNClick(this._inviteButton, 0, true);
    cy.wait("@mockPostAppInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    // cy.contains(email, { matchCase: false });
    cy.contains(successMessage);
  }

  public InviteUserToApplication(email: string, role: string) {
    if (CURRENT_REPO === REPO.CE) {
      this.InviteUserToWorkspaceFromApp(email, role);
    } else {
      this.InviteUserToApplicationFromApp(email, role);
    }
  }

  public DeleteWorkspace(workspaceNameToDelete: string) {
    cy.get(this._homeIcon).click({ force: true });
    this.agHelper.GetNClick(
      this._optionsIconInWorkspace(workspaceNameToDelete),
    );
    this.agHelper.GetNClick(this._wsAction("Delete workspace")); //Are you sure?
    this.agHelper.GetNClick(this._wsAction("Are you sure?")); //
    this.agHelper.AssertContains("Workspace deleted successfully");
  }

  public AssertNCloseImport() {
    this.agHelper.AssertElementVisible(this._importSuccessModal);
    this.agHelper.AssertElementVisible(
      this.locator._visibleTextSpan("Your application is ready to use."),
    );
    this.agHelper.GetNClick(this._importSuccessModalGotit, 0, true);
  }

  public AssertImportToast(timeout = 5000) {
    this.agHelper.AssertContains("Application imported successfully");
    this.agHelper.Sleep(timeout); //for imported app to settle!
    cy.get(this.locator._loading).should("not.exist");
  }

  public ForkApplication(appliName: string, forkWorkspaceName = "") {
    this.agHelper.GetNClick(this._applicationContextMenu(appliName));
    this.agHelper.GetNClick(this._forkApp);
    this.agHelper.AssertElementVisible(this._forkModal);
    if (forkWorkspaceName) {
      this.agHelper.GetNClick(this._forkWorkspaceDropdownOption);
      this.agHelper.GetNClick(
        this._forkWorkspaceSelectOptions(forkWorkspaceName),
      );
    }
    this.agHelper.ClickButton("Fork");
    this.assertHelper.AssertNetworkStatus("getWorkspace");
  }

  public DeleteApplication(appliName: string) {
    this.agHelper.GetNClick(this._applicationContextMenu(appliName));
    this.agHelper.GetNClick(this._deleteApp);
    this.agHelper.GetNClick(this._deleteAppConfirm);
    this.agHelper.WaitUntilToastDisappear("Deleting application...");
  }

  //Maps to leaveworkspace in command.js
  public LeaveWorkspace(workspaceName: string) {
    this.OpenWorkspaceOptions(workspaceName);
    cy.xpath(this._leaveWorkspace).click({ force: true });
    cy.xpath(this._leaveWorkspaceConfirm).click({ force: true });
    this.assertHelper.AssertNetworkStatus("@leaveWorkspaceApiCall");

    this.agHelper.ValidateToastMessage(
      "You have successfully left the workspace",
    );
  }

  public CloseReconnectDataSourceModal() {
    cy.get("body").then(($ele) => {
      if ($ele.find(this._reconnectDataSourceModal).length) {
        this.agHelper.GetNClick(this._skiptoApplicationBtn);
        this.NavigateToHome();
      }
    });
  }
}
