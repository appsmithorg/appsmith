import {
  agHelper,
  assertHelper,
  adminSettings,
  homePage,
  dataSources,
  onboarding,
  jsEditor,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import homePageLocators from "../../../../../locators/HomePage";
import auditLogslocators from "../../../../../locators/AuditLogsLocators";
const AppNavigation = require("../../../../../locators/AppNavigation.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";
let workspaceId: any, appid: any;

describe(
  "Create new workspace and invite group & validate all roles",
  { tags: ["@tag.AccessControl"] },
  () => {
    const GroupName = "group1" + `${Math.floor(Math.random() * 1000)}`;

    beforeEach(() => {
      cy.AddIntercepts();
    });

    before(() => {
      cy.AddIntercepts();
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      agHelper.GetNClick(auditLogslocators.AdminSettingsEntryLink);
      adminSettings.EnableGAC(true, false);
      cy.createGroupAndAddUser(
        GroupName,
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTUSERNAME2"),
      );
    });

    it("1. Create new Workspace, Share App Viewer workspace level access with a group", () => {
      adminSettings.EnableGAC(true, true);

      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceId = uid;
        appid = uid;
        homePage.CreateNewWorkspace(workspaceId);
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        agHelper.VisitNAssert("/applications", "getAllWorkspaces");
        homePage.SelectWorkspace(workspaceId);
        cy.InviteGroupToWorkspace(workspaceId, GroupName, "Developer");
        agHelper.GetNClick(homePage._visibleTextSpan("Manage users"));
        homePage.NavigateToHome();
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 2);
        homePage.CreateAppInWorkspace(workspaceId, appid);
        const jsObjectBody = `export default {
        myVar1: [],
      }`;
        const jsObjectCreationOptions = {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        };
        jsEditor.CreateJSObject(jsObjectBody, jsObjectCreationOptions);
        homePage.NavigateToHome();
        homePage.CreateAppInWorkspace(workspaceId, appid + "Internal Apps");
        jsEditor.CreateJSObject(jsObjectBody, jsObjectCreationOptions);
      });
      homePage.LogOutviaAPI();
    });

    it("2. Share Developer application level access with group", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);
      homePage.SelectWorkspace(workspaceId);

      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      dataSources.CreateDataSource("Postgres");
      agHelper.ClickButton("Share");
      agHelper.GetNClick(homePageLocators.selectRole);

      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 3)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("contain.text", `Assign Custom Role`);
      cy.InviteGroupToApplication(GroupName, "Developer");
      agHelper.GetNClick(homePage._visibleTextSpan("Manage users"));
      agHelper.TypeText(homePage._searchUsersInput, GroupName);
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(GroupName);
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      homePage.NavigateToHome();
      homePage.LogOutviaAPI();
    });

    it("3. Login as Invited user 1 and validate Developer application level access & Developer workspace level access", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      adminSettings.EnableGAC(false, true, "home");
      homePage.SelectWorkspace(workspaceId);
      agHelper.GetElement(homePageLocators.searchInput).type(appid);
      agHelper.GetElement(homePageLocators.appsContainer).contains(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      agHelper.WaitUntilEleDisappear(homePage._appHoverIcon("edit"));
      onboarding.closeIntroModal();
      AppSidebar.navigate(AppSidebarButton.Data);
      agHelper.AssertElementExist(dataSources._addNewDataSource);
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper
        .GetElement(dataSources._dropdownOption)
        .should("contain", "Connect new datasource");
      EditorNavigation.SelectEntityByName("Postgres", EntityType.Datasource);
      agHelper
        .GetElement(dataSources._createQuery)
        .should("not.have.attr", "disabled");
      agHelper.ClickButton("Share");

      agHelper.GetNClick(homePageLocators.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(homePageLocators.manageUsers);
      agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementExist(homePageLocators.optionsIcon);
      homePage.LogOutviaAPI();
    });

    it("4. Login as Administrator and change workspace level access for group to App Viewer and verify", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);

      homePage.SelectWorkspace(workspaceId);

      homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        GroupName,
        "Developer",
        "App Viewer",
      );
      homePage.Signout();
    });

    it("5. Login as Invited user 1 and validate Developer application level access & App Viewer workspace level access", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      adminSettings.EnableGAC(false, true, "home");
      homePage.SelectWorkspace(workspaceId);
      homePage.EditAppFromAppHover(workspaceId + "Internal Apps");
      onboarding.closeIntroModal();
      AppSidebar.navigate(AppSidebarButton.Data);
      agHelper.AssertElementAbsence(dataSources._addNewDataSource);
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper
        .GetElement(dataSources._dropdownOption)
        .should("not.contain", "Connect new datasource");
      EditorNavigation.SelectEntityByName("Postgres", EntityType.Datasource);
      agHelper
        .GetElement(dataSources._createQuery)
        .should("not.have.attr", "disabled");
      agHelper.ClickButton("Share");
      agHelper.GetNClick(homePageLocators.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(homePageLocators.manageUsers);
      agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .last()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementExist(homePageLocators.optionsIcon);
      homePage.LogOutviaAPI();
    });

    it("6. Login as Administrator and delete workspace level role for group", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);

      homePage.SelectWorkspace(workspaceId);
      homePage.DeleteUserFromWorkspace(appid, workspaceId, GroupName);
      agHelper.ClearNType(homePage._searchUsersInput, GroupName);
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(GroupName);
      agHelper.AssertElementAbsence(homePageLocators.DeleteBtn);
      agHelper.GetElement("table").contains("td", "No Access");
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      agHelper.AssertElementExist(homePageLocators.DeleteBtn);
      homePage.LogOutviaAPI();
    });

    it("7. Login as user 1 and validate Developer application level access & No workspace level access", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      adminSettings.EnableGAC(false, true, "home");

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetElement(homePageLocators.appsContainer).contains(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));

      onboarding.closeIntroModal();
      AppSidebar.navigate(AppSidebarButton.Data);
      agHelper.AssertElementAbsence(dataSources._addNewDataSource);
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper
        .GetElement(dataSources._dropdownOption)
        .should("not.contain", "Connect new datasource");
      EditorNavigation.SelectEntityByName("Postgres", EntityType.Datasource);
      agHelper
        .GetElement(dataSources._createQuery)
        .should("not.have.attr", "disabled");
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();

      adminSettings.EnableGAC(false, false, "current");
      assertHelper.AssertDocumentReady();
      agHelper.ClickButton("Share");
      agHelper.GetNClick(homePageLocators.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(homePageLocators.manageUsers);
      agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceId);
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementAbsence(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementAbsence(homePageLocators.optionsIcon);
      homePage.LogOutviaAPI();
    });

    it("8. Login as Administrator and change app level access for group to App Viewer and verify", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetNClick(homePageLocators.optionsIcon);
      agHelper.GetNClick(homePage._visibleTextSpan("Members"));
      agHelper.TypeText(homePage._searchUsersInput, GroupName);
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(GroupName);
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);

      agHelper.GetNClick(RBAC.optionDeveloper, 0, true);
      agHelper.AssertElementAbsence(RBAC.optionAdministrator);
      agHelper.AssertElementExist(RBAC.optionDeveloper);
      agHelper.AssertElementExist(RBAC.optionAppViewer);
      agHelper.GetElement(RBAC.optionAppViewer).last().parent("div").click();

      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      agHelper.AssertElementVisibility(RBAC.optionAppViewer);
      homePage.LogOutviaAPI();

      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      homePage.SelectWorkspace(workspaceId);
      agHelper.AssertContains(
        workspaceId,
        "exist",
        homePageLocators.appsContainer,
      );
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementAbsence(homePageLocators.optionsIcon);
      homePage.LaunchAppFromAppHover(AppNavigation.shareButton);
      agHelper.GetNClick(AppNavigation.shareButton);
      agHelper.GetNClick(homePageLocators.selectRole);
      // app level
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      agHelper.AssertElementAbsence(homePageLocators.manageUsers);
      agHelper.GetNClick(homePageLocators.closeBtn, 0, true);
      homePage.LogOutviaAPI();
    });

    it("9. Login as Administrator and delete app level access for group", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetNClick(homePageLocators.optionsIcon);
      agHelper.GetNClick(homePage._visibleTextSpan("Members"));
      agHelper.TypeText(homePage._searchUsersInput, GroupName);
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(GroupName);
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      agHelper.GetNClick(homePageLocators.DeleteBtn, 0, true);

      agHelper.AssertElementVisibility(
        homePageLocators.leaveWorkspaceConfirmModal,
      );
      cy.get(homePageLocators.leaveWorkspaceConfirmButton).click({
        force: true,
      });

      agHelper.TypeText(homePage._searchUsersInput, GroupName);
      agHelper.AssertElementAbsence(RBAC.searchHighlight);
      homePage.LogOutviaAPI();
    });

    after(() => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, false);
      agHelper.VisitNAssert("settings/groups", "fetchGroups");
      cy.DeleteGroup(GroupName);
    });
  },
);
