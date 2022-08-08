import { ObjectsRegistry } from "../Objects/Registry";
export class HomePage {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;

  private _username = "input[name='username']";
  private _password = "input[name='password']";
  private _submitBtn = "button[type='submit']";
  private _workspaceCompleteSection = ".t--workspace-section";
  private _workspaceName = ".t--workspace-name";
  private _optionsIcon = ".t--options-icon";
  private _optionsIconInWorkspace = (workspaceName: string) =>
    "//span[text()='" +
    workspaceName +
    "']/ancestor::div[contains(@class, 't--workspace-section')]//span[contains(@class, 't--options-icon')]";
  private _renameWorkspaceInput = "[data-cy=t--workspace-rename-input]";
  private _workspaceList = (workspaceName: string) =>
    ".t--workspace-section:contains(" + workspaceName + ")";
  private _workspaceShareUsersIcon = (workspaceName: string) =>
    ".t--workspace-section:contains(" +
    workspaceName +
    ") .workspace-share-user-icons";
  private _shareWorkspace = (workspaceName: string) =>
    ".t--workspace-section:contains(" +
    workspaceName +
    ") button:contains('Share')";
  private _email = "//input[@type='email']";
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  private _userRole = (role: string) =>
    "//div[contains(@class, 'label-container')]//span[1][text()='" +
    role +
    "']";
  private _manageUsers = ".manageUsers";
  private _appHome = "//a[@href='/applications']";
  _applicationCard = ".t--application-card";
  private _homeIcon = ".t--appsmith-logo";
  private _appContainer = ".t--applications-container";
  private _homePageAppCreateBtn = this._appContainer + " .createnew";
  private _existingWorkspaceCreateNewApp = (existingWorkspaceName: string) =>
    `//span[text()='${existingWorkspaceName}']/ancestor::div[contains(@class, 't--workspace-section')]//button[contains(@class, 't--new-button')]`;
  private _applicationName = ".t--application-name";
  private _editAppName = "bp3-editable-text-editing";
  private _appMenu = ".t--editor-appname-menu-portal .bp3-menu-item";
  private _buildFromScratchActionCard = ".t--BuildFromScratch";
  _buildFromDataTableActionCard = ".t--GenerateCRUDPage";
  private _selectRole = "//span[text()='Select a role']/ancestor::div";
  private _searchInput = "input[type='text']";
  _appHoverIcon = (action: string) => ".t--application-" + action + "-link";
  private _deleteUser = (email: string) =>
    "//td[text()='" +
    email +
    "']/following-sibling::td//span[contains(@class, 't--deleteUser')]";
  private _userRoleDropDown = (email: string, role: string) =>
    "//td[text()='" +
    email +
    "']/following-sibling::td//span[text()='" +
    role +
    "']";
  //private _userRoleDropDown = (email: string) => "//td[text()='" + email + "']/following-sibling::td"
  private _leaveWorkspaceConfirmModal = ".t--member-delete-confirmation-modal";
  private _workspaceImportAppModal = ".t--import-application-modal";
  private _leaveWorkspaceConfirmButton =
    "[data - cy= t--workspace-leave - button]";
  private _lastWorkspaceInHomePage =
    "//div[contains(@class, 't--workspace-section')][last()]//span/span";
  _editPageLanding = "//h2[text()='Drag and drop a widget here']";
  _usersEmailList = "[data-colindex='1']";
  private _workspaceImport = "[data-cy=t--workspace-import-app]";
  private _uploadFile = "//div/form/input";
  private _importSuccessModal = ".t--import-app-success-modal";
  private _forkModal = ".fork-modal";
  private _importSuccessModalGotit = ".t--import-success-modal-got-it";
  private _applicationContextMenu = (applicationName: string) =>
    "//span[text()='" +
    applicationName +
    "']/ancestor::div[contains(@class, 't--application-card')]//span[@name= 'context-menu']";
  private _forkApp = '[data-cy="t--fork-app"]';
  private _duplicateApp = '[data-cy="t--duplicate"]';
  private _deleteApp = '[data-cy="t--delete-confirm"]';
  private _deleteAppConfirm = '[data-cy="t--delete"]';
  private _wsAction = (action: string) =>
    "//span[text()='" + action + "']/ancestor::a";

  public CreateNewWorkspace(workspaceNewName: string) {
    let oldName: string = "";
    cy.xpath(this._visibleTextSpan("New Workspace"))
      .should("be.visible")
      .first()
      .click({ force: true });
    cy.wait("@createWorkspace");
    this.agHelper.Sleep(2000);
    cy.xpath(this._lastWorkspaceInHomePage)
      .first()
      .then(($ele) => {
        oldName = $ele.text();
        cy.log("oldName is : " + oldName);
        this.RenameWorkspace(oldName, workspaceNewName);
      });
  }

  public RenameWorkspace(workspaceName: string, newWorkspaceName: string) {
    cy.get(this._appContainer)
      .contains(workspaceName)
      .closest(this._workspaceCompleteSection)
      .find(this._workspaceName)
      .find(this._optionsIcon)
      .click({ force: true });
    cy.get(this._renameWorkspaceInput)
      .should("be.visible")
      .type(newWorkspaceName.concat("{enter}"));
    this.agHelper.Sleep(2000);
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.contains(newWorkspaceName);
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
    const successMessage = "The user has been invited successfully";
    this.StubPostHeaderReq();
    this.agHelper.AssertElementVisible(this._workspaceList(workspaceName));
    this.agHelper.GetNClick(this._shareWorkspace(workspaceName), 0, true);
    cy.xpath(this._email)
      .click({ force: true })
      .type(email);
    cy.xpath(this._selectRole)
      .first()
      .click({ force: true });
    this.agHelper.Sleep(500);
    cy.xpath(this._userRole(role)).click({ force: true });
    this.agHelper.ClickButton("Invite");
    cy.wait("@mockPostInvite")
      .its("request.headers")
      .should("have.property", "origin", "Cypress");
    cy.contains(email, { matchCase: false });
    cy.contains(successMessage);
  }

  public StubPostHeaderReq() {
    cy.intercept("POST", "/api/v1/users/invite", (req) => {
      req.headers["origin"] = "Cypress";
    }).as("mockPostInvite");
  }

  public NavigateToHome() {
    cy.get(this._homeIcon).click({ force: true });
    this.agHelper.Sleep(3000);
    //cy.wait("@applications"); this randomly fails & introduces flakyness hence commenting!
    cy.get(this._homePageAppCreateBtn)
      .should("be.visible")
      .should("be.enabled");
  }

  public CreateNewApplication() {
    cy.get(this._homePageAppCreateBtn)
      .first()
      .click({ force: true });
    this.agHelper.ValidateNetworkStatus("@createNewApplication", 201);
    cy.get(this.locator._loading).should("not.exist");
  }

  //Maps to CreateAppForWorkspace in command.js
  public CreateAppInWorkspace(workspaceName: string, appname: string = "") {
    cy.xpath(this._existingWorkspaceCreateNewApp(workspaceName))
      .scrollIntoView()
      .should("be.visible")
      .click({ force: true });
    this.agHelper.ValidateNetworkStatus("@createNewApplication", 201);
    cy.get(this.locator._loading).should("not.exist");
    this.agHelper.Sleep(2000);
    if(appname) this.RenameApplication(appname);
    cy.get(this._buildFromScratchActionCard).click();
    //this.agHelper.ValidateNetworkStatus("@updateApplication", 200);
  }

  //Maps to AppSetupForRename in command.js
  public RenameApplication(appName: string) {
    cy.get(this._applicationName).then(($appName) => {
      if (!$appName.hasClass(this._editAppName)) {
        cy.get(this._applicationName).click();
        cy.get(this._appMenu)
          .contains("Edit Name", { matchCase: false })
          .click();
      }
    });
    cy.get(this._applicationName).type(appName + "{enter}");
  }

  //Maps to LogOut in command.js
  public LogOutviaAPI() {
    cy.request("POST", "/api/v1/logout");
    this.agHelper.Sleep(); //for logout to complete!
  }

  public LogintoApp(
    uname: string,
    pswd: string,
    role: "App Viewer" | "Developer" | "Administrator" = "Administrator",
  ) {
    this.agHelper.Sleep(); //waiting for window to load
    cy.window()
      .its("store")
      .invoke("dispatch", { type: "LOGOUT_USER_INIT" });
    cy.wait("@postLogout");
    cy.visit("/user/login");
    cy.get(this._username)
      .should("be.visible")
      .type(uname);
    cy.get(this._password).type(pswd, { log: false });
    cy.get(this._submitBtn).click();
    cy.wait("@getMe");
    this.agHelper.Sleep(3000);
    if (role != "App Viewer")
      cy.get(this._homePageAppCreateBtn)
        .should("be.visible")
        .should("be.enabled");
  }

  public FilterApplication(appName: string, workspaceId: string) {
    cy.get(this._searchInput).type(appName);
    this.agHelper.Sleep(2000);
    cy.get(this._appContainer).contains(workspaceId);
    cy.xpath(this.locator._spanButton("Share"))
      .first()
      .should("be.visible");
  }

  //Maps to launchApp in command.js
  public LaunchAppFromAppHover() {
    cy.get(this._appHoverIcon("view"))
      .should("be.visible")
      .first()
      .click();
    cy.get(this.locator._loading).should("not.exist");
    cy.wait("@getPagesForViewApp").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  }

  //Maps to deleteUserFromWorkspace in command.js
  public DeleteUserFromWorkspace(workspaceName: string, email: string) {
    cy.get(this._workspaceList(workspaceName))
      .scrollIntoView()
      .should("be.visible");
    cy.contains(workspaceName)
      .closest(this._workspaceCompleteSection)
      .find(this._workspaceName)
      .find(this._optionsIcon)
      .click({ force: true });
    cy.xpath(this._visibleTextSpan("Members")).click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(this._deleteUser(email))
      .last()
      .click({ force: true });
    cy.get(this._leaveWorkspaceConfirmModal).should("be.visible");
    cy.get(this._leaveWorkspaceConfirmButton).click({ force: true });
    this.NavigateToHome();
  }

  public OpenMembersPageForWorkspace(workspaceName: string) {
    cy.get(this._appContainer)
      .contains(workspaceName)
      .scrollIntoView()
      .should("be.visible");
    cy.get(this._appContainer)
      .contains(workspaceName)
      .closest(this._workspaceCompleteSection)
      .find(this._workspaceName)
      .find(this._optionsIcon)
      .click({ force: true });
    cy.xpath(this._visibleTextSpan("Members"))
      .last()
      .click({ force: true });
    cy.wait("@getMembers").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    this.agHelper.Sleep(2500); //wait for members page to load!
  }

  public UpdateUserRoleInWorkspace(
    workspaceName: string,
    email: string,
    currentRole: string,
    newRole: string,
  ) {
    this.OpenMembersPageForWorkspace(workspaceName);
    cy.xpath(this._userRoleDropDown(email, currentRole))
      .first()
      .trigger("click");
    //cy.xpath(this._userRoleDropDown(email)).first().click({force: true});
    cy.xpath(this._visibleTextSpan(newRole))
      .last()
      .click({ force: true });
    this.agHelper.Sleep();
    this.NavigateToHome();
  }

  public ImportApp(fixtureJson: string, intoWorkspaceName = "") {
    cy.get(this._homeIcon).click();
    if (intoWorkspaceName)
      this.agHelper.GetNClick(this._optionsIconInWorkspace(intoWorkspaceName));
    else this.agHelper.GetNClick(this._optionsIcon);
    this.agHelper.GetNClick(this._workspaceImport, 0, true);
    this.agHelper.AssertElementVisible(this._workspaceImportAppModal);
    cy.xpath(this._uploadFile).attachFile(fixtureJson);
    this.agHelper.Sleep(3500);
  }

  public DeleteWorkspace(workspaceNameToDelete: string) {
    cy.get(this._homeIcon).click();
    this.agHelper.GetNClick(
      this._optionsIconInWorkspace(workspaceNameToDelete),
    );
    this.agHelper.GetNClick(this._wsAction("Delete Workspace")); //Are you sure?
    this.agHelper.GetNClick(this._wsAction("Are you sure?")); //
    this.agHelper.ValidateToastMessage("Workspace deleted successfully");
  }

  public AssertNCloseImport() {
    this.agHelper.AssertElementVisible(this._importSuccessModal);
    this.agHelper.GetNClick(this._importSuccessModalGotit, 0, true);
  }

  public AssertImportToast() {
    this.agHelper.WaitUntilToastDisappear("Application imported successfully");
    this.agHelper.Sleep(5000); //for imported app to settle!
    cy.get(this.locator._loading).should("not.exist");
  }

  public ForkApplication(appliName: string) {
    this.agHelper.GetNClick(this._applicationContextMenu(appliName));
    this.agHelper.GetNClick(this._forkApp);
    this.agHelper.AssertElementVisible(this._forkModal);
    this.agHelper.ClickButton("FORK");
  }

  public DuplicateApplication(appliName: string) {
    this.agHelper.GetNClick(this._applicationContextMenu(appliName));
    this.agHelper.GetNClick(this._duplicateApp);
    this.agHelper.WaitUntilToastDisappear("Duplicating application...");
  }

  public DeleteApplication(appliName: string) {
    this.agHelper.GetNClick(this._applicationContextMenu(appliName));
    this.agHelper.GetNClick(this._deleteApp);
    this.agHelper.GetNClick(this._deleteAppConfirm);
  }
}
