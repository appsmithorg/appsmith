import {
  agHelper,
  adminSettings,
  locators,
  homePage,
  dataSources,
  onboarding,
  jsEditor,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../../locators/HomePage";
const AppNavigation = require("../../../../../locators/AppNavigation.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";
let workspaceId: any;
let appid: any;

describe(
  "Create new workspace and invite user & validate all roles",
  { tags: ["@tag.AccessControl"] },
  () => {
    it("1. Create new Workspace, Share App Viewer workspace level access with users", () => {
      adminSettings.EnableGAC();

      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceId = uid;
        appid = uid;

        homePage.CreateNewWorkspace(workspaceId);
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        homePage.InviteUserToWorkspaceErrorMessage(workspaceId, "abcdef");
        agHelper.VisitNAssert("/applications");
        homePage.InviteUserToWorkspace(
          workspaceId,
          Cypress.env("TESTUSERNAME1"),
          "Developer",
        );
        homePage.InviteUserToWorkspace(
          workspaceId,
          Cypress.env("TESTUSERNAME2"),
          "App Viewer",
        );
        agHelper.GetNClick(homePage._visibleTextSpan("Manage users"));
        homePage.NavigateToHome();
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 3);
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

    it("2. Share Developer application level access with user 1", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);
      homePage.FilterApplication(appid, workspaceId);

      agHelper.WaitUntilEleAppear(homePage._applicationCard);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      dataSources.CreateDataSource("Postgres");
      agHelper.ClickButton("Share");
      agHelper.GetNClick(HomePage.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 3)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("contain.text", `Assign Custom Role`);
      homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      agHelper.GetNClick(homePage._visibleTextSpan("Manage users"));
      agHelper.TypeText(
        homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
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
      agHelper.AssertElementAbsence(locators._buttonByText("Upgrade"));
      homePage.SelectWorkspace(workspaceId);
      agHelper.GetElement(HomePage.appsContainer).contains(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      onboarding.closeIntroModal();
      AppSidebar.navigate(AppSidebarButton.Data);
      agHelper.AssertElementExist(dataSources._newDatasourceBtn);
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("New blank page");
      dataSources.CreateDataSource("Postgres");
      agHelper
        .GetElement(dataSources._createQuery)
        .should("not.have.attr", "disabled");
      agHelper.ClickButton("Share");
      agHelper.GetNClick(HomePage.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.FilterApplication(appid + "Internal Apps", workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementExist(HomePage.optionsIcon);
      homePage.LogOutviaAPI();
    });

    it("4. Login as Administrator and change workspace level access for user 1 to App Viewer and verify", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);
      homePage.SelectWorkspace(workspaceId);

      homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
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
      agHelper.GetElement(HomePage.appsContainer).contains(workspaceId);
      homePage.EditAppFromAppHover(appid + "Internal Apps");
      agHelper.AssertElementAbsence(dataSources._addNewDataSource);
      onboarding.closeIntroModal();
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
      agHelper.GetNClick(HomePage.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceId);
      agHelper
        .GetElement(homePage._appCard(appid))
        .first()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementExist(HomePage.optionsIcon);
      homePage.LogOutviaAPI();
    });

    it("6. Login as Invited user 2 and validate App Viewer workspace level access", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
        "App Viewer",
      );
      adminSettings.EnableGAC(false, true, "home");
      homePage.SelectWorkspace(workspaceId);

      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementExist(HomePage.optionsIcon);
      agHelper.GetNClick(homePage._shareWorkspace(workspaceId));
      // workspace level
      agHelper.GetNClick(HomePage.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.closeBtn);
      homePage.LaunchAppFromAppHover(AppNavigation.shareButton);
      agHelper.GetNClick(AppNavigation.shareButton);
      agHelper.WaitUntilEleAppear(HomePage.selectRole);
      agHelper.GetNClick(HomePage.selectRole);
      // app level
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.closeBtn);
      homePage.LogOutviaAPI();
    });

    it("7. Login as Administrator and delete workspace level role for user 1", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);
      homePage.SelectWorkspace(workspaceId);
      homePage.DeleteUserFromWorkspace(
        appid,
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
      );
      agHelper.ClearNType(
        homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      agHelper.AssertElementAbsence(HomePage.DeleteBtn);
      agHelper.GetElement("table").contains("td", "No Access");
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      agHelper.AssertElementExist(HomePage.DeleteBtn);
      homePage.LogOutviaAPI();
    });

    it("8. Login as user 1 and validate Developer application level access & No workspace level access", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      adminSettings.EnableGAC(false, true, "home");

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetElement(HomePage.appsContainer).contains(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      agHelper.AssertElementAbsence(dataSources._addNewDataSource);
      onboarding.closeIntroModal();
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
      agHelper.ClickButton("Share");
      agHelper.WaitUntilEleAppear(HomePage.selectRole);
      agHelper.GetNClick(HomePage.selectRole);
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      homePage.NavigateToHome();
      homePage.SelectWorkspace(workspaceId);
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementAbsence(homePage._shareWorkspace(workspaceId));
      agHelper.AssertElementAbsence(HomePage.optionsIcon);

      homePage.LogOutviaAPI();
    });

    it("9. Login as Administrator and change app level access for user 1 to App Viewer and verify", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);

      homePage.SelectWorkspace(workspaceId);
      agHelper.GetNClick(HomePage.optionsIcon);
      agHelper.GetNClick(homePage._visibleTextSpan("Members"));
      agHelper.TypeText(
        homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
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
      agHelper.GetElement(HomePage.appsContainer).contains(workspaceId);
      agHelper
        .GetElement(homePage._applicationCard)
        .first()
        .trigger("mouseover");
      agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
      agHelper.AssertElementAbsence(HomePage.optionsIcon);
      homePage.LaunchAppFromAppHover(AppNavigation.shareButton);
      agHelper.GetNClick(AppNavigation.shareButton);
      agHelper.WaitUntilEleAppear(HomePage.selectRole);
      agHelper.GetNClick(HomePage.selectRole);
      // app level
      agHelper
        .GetElement(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      agHelper.AssertElementAbsence(HomePage.manageUsers);
      agHelper.GetNClick(HomePage.closeBtn);
      homePage.LogOutviaAPI();
    });

    it("10. Login as Administrator and delete app level access for user 1", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      adminSettings.EnableGAC(false, true);
      homePage.SelectWorkspace(workspaceId);
      agHelper.GetNClick(HomePage.optionsIcon);
      agHelper.GetNClick(homePage._visibleTextSpan("Members"));
      agHelper.TypeText(
        homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      agHelper
        .GetElement(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      agHelper.GetNClick(HomePage.DeleteBtn, 0, true);
      agHelper.AssertElementVisibility(HomePage.leaveWorkspaceConfirmModal);
      agHelper.GetNClick(HomePage.leaveWorkspaceConfirmButton, 0, true);

      agHelper.TypeText(
        homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight).should("not.exist");
      homePage.LogOutviaAPI();
    });
  },
);
