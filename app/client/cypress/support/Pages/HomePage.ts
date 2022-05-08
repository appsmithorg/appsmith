import { ObjectsRegistry } from "../Objects/Registry"
export class HomePage {

    private agHelper = ObjectsRegistry.AggregateHelper;
    private locator = ObjectsRegistry.CommonLocators;

    private _username = "input[name='username']"
    private _password = "input[name='password']"
    private _submitBtn = "button[type='submit']"
    private _orgCompleteSection = ".t--org-section"
    private _orgName = ".t--org-name"
    private _optionsIcon = ".t--options-icon"
    private _renameOrgInput = "[data-cy=t--org-rename-input]"
    private _orgList = (orgName: string) => ".t--org-section:contains(" + orgName + ")"
    private _orgShareUsersIcon = (orgName: string) => ".t--org-section:contains(" + orgName + ") .org-share-user-icons"
    private _shareOrg = (orgName: string) => ".t--org-section:contains(" + orgName + ") button:contains('Share')"
    private _email = "//input[@type='email']"
    _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']"
    private _userRole = (role: string) => "//div[contains(@class, 'label-container')]//span[1][text()='" + role + "']"
    private _manageUsers = ".manageUsers"
    private _appHome = "//a[@href='/applications']"
    _applicationCard = ".t--application-card"
    private _homeIcon = ".t--appsmith-logo"
    private _appContainer = ".t--applications-container"
    private _homePageAppCreateBtn = this._appContainer + " .createnew"
    private _newOrganizationCreateNewApp = (newOrgName: string) => "//span[text()='" + newOrgName + "']/ancestor::div[contains(@class, 't--org-name-text')]/parent::div/following-sibling::div//button[contains(@class, 't--new-button')]"
    private _existingOrganizationCreateNewApp = (existingOrgName: string) => "//span[text()='" + existingOrgName + "']/ancestor::div[contains(@class, 't--org-name-text')]/following-sibling::div//button[contains(@class, 't--new-button')]"
    private _applicationName = ".t--application-name"
    private _editAppName = "bp3-editable-text-editing"
    private _appMenu = ".t--editor-appname-menu-portal .bp3-menu-item"
    private _buildFromScratchActionCard = ".t--BuildFromScratch"
    private _buildFromDataTableActionCard = ".t--GenerateCRUDPage"
    private _selectRole = "//span[text()='Select a role']/ancestor::div"
    private _searchInput = "input[type='text']"
    _appHoverIcon = (action: string) => ".t--application-" + action + "-link"
    private _deleteUser = (email: string) => "//td[text()='" + email + "']/following-sibling::td//span[contains(@class, 't--deleteUser')]"
    private _userRoleDropDown = (email: string, role: string) => "//td[text()='" + email + "']/following-sibling::td//span[text()='" + role + "']"
    //private _userRoleDropDown = (email: string) => "//td[text()='" + email + "']/following-sibling::td"
    private _leaveOrgConfirmModal = ".t--member-delete-confirmation-modal"
    private _orgImportAppModal = ".t--import-application-modal"
    private _leaveOrgConfirmButton = "[data - cy= t--org-leave - button]"
    private _lastOrgInHomePage = "//div[contains(@class, 't--org-section')][last()]//span/span"
    _editPageLanding = "//h2[text()='Drag and drop a widget here']"
    _usersEmailList = "[data-colindex='1']"
    private _orgImport = "[data-cy=t--org-import-app]"
    private _uploadFile = "//div/form/input"

    public CreateNewOrg(orgNewName: string) {
        let oldName: string = ""
        cy.xpath(this._visibleTextSpan('New Organization'))
            .should("be.visible")
            .first()
            .click({ force: true });
        cy.wait("@createOrg")
        this.agHelper.Sleep(2000)
        cy.xpath(this._lastOrgInHomePage).first().then($ele => {
            oldName = $ele.text();
            cy.log("oldName is : " + oldName);
            this.RenameOrg(oldName, orgNewName);
        })
    }

    public RenameOrg(orgName: string, newOrgName: string) {
        cy.contains(orgName)
            .closest(this._orgCompleteSection)
            .find(this._orgName)
            .find(this._optionsIcon)
            .click({ force: true });
        cy.get(this._renameOrgInput)
            .should("be.visible")
            .type(newOrgName.concat("{enter}"));
        this.agHelper.Sleep(2000)
        cy.wait("@updateOrganization").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
        );
        cy.contains(newOrgName);
    }

    //Maps to CheckShareIcon in command.js
    public CheckOrgShareUsersCount(orgName: string, count: number) {
        cy.get(this._orgList(orgName))
            .scrollIntoView()
            .should("be.visible");
        cy.get(this._orgShareUsersIcon(orgName)).should("have.length", count);
    }

    //Maps to inviteUserForOrg in command.js
    public InviteUserToOrg(orgName: string, email: string, role: string) {
        const successMessage = "The user has been invited successfully";
        this.stubPostHeaderReq();
        cy.get(this._orgList(orgName))
            .scrollIntoView()
            .should("be.visible");
        cy.get(this._shareOrg(orgName))
            .first()
            .should("be.visible")
            .click({ force: true });
        cy.xpath(this._email)
            .click({ force: true })
            .type(email);
        cy.xpath(this._selectRole).first().click({ force: true });
        this.agHelper.Sleep(500)
        cy.xpath(this._userRole(role)).click({ force: true });
        this.agHelper.ClickButton('Invite')
        cy.wait("@mockPostInvite")
            .its("request.headers")
            .should("have.property", "origin", "Cypress");
        cy.contains(email, { matchCase: false });
        cy.contains(successMessage);
    }

    public stubPostHeaderReq() {
        cy.intercept("POST", "/api/v1/users/invite", (req) => { req.headers["origin"] = "Cypress"; }).as("mockPostInvite");
    }

    public NavigateToHome() {
        cy.get(this._homeIcon).click({ force: true });
        this.agHelper.Sleep(3000)
        //cy.wait("@applications"); this randomly fails & introduces flakyness hence commenting!
        cy.get(this._homePageAppCreateBtn).should("be.visible").should("be.enabled");
    }

    public CreateNewApplication() {
        cy.get(this._homePageAppCreateBtn).first().click({ force: true })
        this.agHelper.ValidateNetworkStatus("@createNewApplication", 201)
        cy.get(this.locator._loading).should("not.exist");
    }

    //Maps to CreateAppForOrg in command.js
    public CreateAppInOrg(orgName: string, appname: string) {
        cy.xpath(this._newOrganizationCreateNewApp(orgName))
            .scrollIntoView()
            .should("be.visible")
            .click({ force: true });
        cy.wait("@createNewApplication").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
        cy.get(this.locator._loading).should("not.exist");
        this.agHelper.Sleep(2000)
        this.RenameApplication(appname)
        cy.get(this._buildFromScratchActionCard).click();
        cy.wait("@updateApplication").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
        );
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
        this.agHelper.Sleep()//for logout to complete!
    }

    public LogintoApp(uname: string, pswd: string, role: 'App Viewer' | 'Developer' | 'Administrator' = 'Administrator') {
        this.agHelper.Sleep() //waiting for window to load
        cy.window().its("store").invoke("dispatch", { type: "LOGOUT_USER_INIT" });
        cy.wait("@postLogout");
        cy.visit("/user/login");
        cy.get(this._username).should("be.visible").type(uname)
        cy.get(this._password).type(pswd, {log: false});
        cy.get(this._submitBtn).click();
        cy.wait("@getMe");
        this.agHelper.Sleep(3000)
        if (role != 'App Viewer')
            cy.get(this._homePageAppCreateBtn).should("be.visible").should("be.enabled");
    }

    public FilterApplication(appName: string, orgId: string) {
        cy.get(this._searchInput).type(appName);
        this.agHelper.Sleep(2000)
        cy.get(this._appContainer).contains(orgId);
        cy.xpath(this.locator._spanButton('Share'))
            .first()
            .should("be.visible")
    }

    //Maps to launchApp in command.js
    public LaunchAppFromAppHover() {
        cy.get(this._appHoverIcon('view'))
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

    //Maps to deleteUserFromOrg in command.js
    public DeleteUserFromOrg(orgName: string, email: string) {
        cy.get(this._orgList(orgName))
            .scrollIntoView()
            .should("be.visible");
        cy.contains(orgName)
            .closest(this._orgCompleteSection)
            .find(this._orgName)
            .find(this._optionsIcon)
            .click({ force: true });
        cy.xpath(this._visibleTextSpan('Members')).click({ force: true });
        cy.wait("@getMembers").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
        );
        cy.get(this._deleteUser(email))
            .last()
            .click({ force: true });
        cy.get(this._leaveOrgConfirmModal).should("be.visible");
        cy.get(this._leaveOrgConfirmButton).click({ force: true });
        this.NavigateToHome()
    }

    public OpenMembersPageForOrg(orgName: string) {
        cy.get(this._appContainer).contains(orgName)
            .scrollIntoView()
            .should("be.visible");
        cy.get(this._appContainer).contains(orgName)
            .closest(this._orgCompleteSection)
            .find(this._orgName)
            .find(this._optionsIcon)
            .click({ force: true });
        cy.xpath(this._visibleTextSpan('Members')).last().click({ force: true });
        cy.wait("@getMembers").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
        );
        this.agHelper.Sleep(2500)//wait for members page to load!
    }

    public UpdateUserRoleInOrg(orgName: string, email: string, currentRole: string, newRole: string) {
        this.OpenMembersPageForOrg(orgName)
        cy.xpath(this._userRoleDropDown(email, currentRole)).first().trigger('click');
        //cy.xpath(this._userRoleDropDown(email)).first().click({force: true});
        cy.xpath(this._visibleTextSpan(newRole)).last().click({ force: true });
        this.agHelper.Sleep()
        this.NavigateToHome()
    }

    public ImportApp(fixtureJson: string) {
        cy.get(this._homeIcon).click();
        cy.get(this._optionsIcon).first().click();
        cy.get(this._orgImport).click({ force: true });
        cy.get(this._orgImportAppModal).should("be.visible");
        cy.xpath(this._uploadFile).attachFile(fixtureJson).wait(500);
        cy.get(this._orgImportAppModal).should("not.exist");
    }

    public AssertImport() {
        this.agHelper.ValidateToastMessage("Application imported successfully")
        this.agHelper.Sleep(5000)//for imported app to settle!
        cy.get(this.locator._loading).should("not.exist");
    }
}


