import * as _ from "../../../../../support/Objects/ObjectsCore";
import HomePage from "../../../../../locators/HomePage";
const AppNavigation = require("../../../../../locators/AppNavigation.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";
let workspaceId, appid;

describe(
  "Create new workspace and invite user & validate all roles",
  { tags: ["@tag.AccessControl"] },
  () => {
    it("1. Create new Workspace, Share App Viewer workspace level access with users", () => {
      _.homePage.NavigateToHome();
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);

      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceId = uid;
        appid = uid;

        _.homePage.CreateNewWorkspace(workspaceId);
        _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        _.homePage.InviteUserToWorkspaceErrorMessage(workspaceId, "abcdef");
        cy.visit("/applications");
        _.homePage.InviteUserToWorkspace(
          workspaceId,
          Cypress.env("TESTUSERNAME1"),
          "Developer",
        );
        _.homePage.InviteUserToWorkspace(
          workspaceId,
          Cypress.env("TESTUSERNAME2"),
          "App Viewer",
        );
        _.agHelper.GetNClick(_.homePage._visibleTextSpan("Manage users"));
        _.homePage.NavigateToHome();
        _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 3);
        _.homePage.CreateAppInWorkspace(workspaceId, appid);
        const jsObjectBody = `export default {
        myVar1: [],
      }`;
        const jsObjectCreationOptions = {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        };
        _.jsEditor.CreateJSObject(jsObjectBody, jsObjectCreationOptions);
        _.homePage.NavigateToHome();
        _.homePage.CreateAppInWorkspace(workspaceId, appid + "Internal Apps");
        _.jsEditor.CreateJSObject(jsObjectBody, jsObjectCreationOptions);
      });
      _.homePage.LogOutviaAPI();
    });

    it("2. Share Developer application level access with user 1", () => {
      _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      _.homePage.NavigateToHome();
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.homePage.FilterApplication(appid, workspaceId);

      cy.wait(2000);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
      _.agHelper.Sleep(2000);
      _.dataSources.CreateDataSource("Postgres");
      _.agHelper.Sleep(2000);
      _.agHelper.ClickButton("Share");
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(RBAC.dropdownOption)
        .should("have.length", 3)
        .should("contain.text", `App Viewer`, `Developer`);
      cy.get(RBAC.dropdownOption).should("contain.text", `Assign Custom Role`);
      _.homePage.InviteUserToApplication(
        Cypress.env("TESTUSERNAME1"),
        "Developer",
      );
      _.agHelper.GetNClick(_.homePage._visibleTextSpan("Manage users"));
      _.agHelper.TypeText(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      _.agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      _.agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      _.homePage.NavigateToHome();
      _.homePage.LogOutviaAPI();
    });

    it("3. Login as Invited user 1 and validate Developer application level access & Developer workspace level access", () => {
      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.agHelper.AssertElementAbsence(_.locators._buttonByText("Upgrade"));
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(HomePage.appsContainer).contains(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
      _.agHelper.Sleep(2000);
      _.onboarding.closeIntroModal();
      AppSidebar.navigate(AppSidebarButton.Data);
      _.agHelper.AssertElementExist(_.dataSources._newDatasourceBtn);
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageList.AddNewPage("New blank page");
      _.dataSources.CreateDataSource("Postgres");
      cy.get(_.dataSources._createQuery).should("not.have.attr", "disabled");
      _.agHelper.ClickButton("Share");
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      _.homePage.NavigateToHome();
      _.homePage.FilterApplication(appid + "Internal Apps", workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));
      _.agHelper.AssertElementExist(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.AssertElementExist(HomePage.optionsIcon);
      _.homePage.LogOutviaAPI();
    });

    it("4. Login as Administrator and change workspace level access for user 1 to App Viewer and verify", () => {
      _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.homePage.SelectWorkspace(workspaceId);

      _.homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "Developer",
        "App Viewer",
      );
      _.homePage.Signout();
    });

    it("5. Login as Invited user 1 and validate Developer application level access & App Viewer workspace level access", () => {
      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      _.homePage.SelectWorkspace(workspaceId);
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(HomePage.appsContainer).contains(workspaceId);
      _.agHelper
        .GetElement(_.homePage._appCard(appid + "Internal Apps"))
        .first()
        .trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
      _.agHelper.Sleep(2000);
      _.agHelper.AssertElementAbsence(_.dataSources._addNewDataSource);
      _.onboarding.closeIntroModal();
      PageList.AddNewPage("Generate page with data");
      _.agHelper.GetNClick(_.dataSources._selectDatasourceDropdown);
      cy.get(_.dataSources._dropdownOption).should(
        "not.contain",
        "Connect new datasource",
      );
      EditorNavigation.SelectEntityByName("Postgres", EntityType.Datasource);
      cy.get(_.dataSources._createQuery).should("not.have.attr", "disabled");
      _.agHelper.ClickButton("Share");
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      _.homePage.NavigateToHome();
      _.homePage.SelectWorkspace(workspaceId);
      _.agHelper
        .GetElement(_.homePage._appCard(appid))
        .first()
        .trigger("mouseover");
      _.agHelper.AssertElementAbsence(_.homePage._appHoverIcon("edit"));
      _.agHelper.AssertElementExist(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.AssertElementExist(HomePage.optionsIcon);
      _.homePage.LogOutviaAPI();
    });

    it("6. Login as Invited user 2 and validate App Viewer workspace level access", () => {
      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
        "App Viewer",
      );
      _.homePage.SelectWorkspace(workspaceId);
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.homePage.SelectWorkspace(workspaceId);

      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementAbsence(_.homePage._appHoverIcon("edit"));
      _.agHelper.AssertElementExist(HomePage.optionsIcon);
      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
      // workspace level
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.homePage.LaunchAppFromAppHover();
      _.agHelper.Sleep(2000);
      _.agHelper.GetNClick(AppNavigation.shareButton);
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      // app level
      cy.get(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.homePage.LogOutviaAPI();
    });

    it("7. Login as Administrator and delete workspace level role for user 1", () => {
      _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      _.homePage.SelectWorkspace(workspaceId);
      _.homePage.DeleteUserFromWorkspace(
        appid,
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
      );
      _.agHelper.ClearNType(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      _.agHelper.AssertElementAbsence(HomePage.DeleteBtn);
      cy.get("table").contains("td", "No Access");
      _.agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      _.agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      _.agHelper.AssertElementExist(HomePage.DeleteBtn);
      _.homePage.LogOutviaAPI();
    });

    it("8. Login as user 1 and validate Developer application level access & No workspace level access", () => {
      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);

      _.homePage.SelectWorkspace(workspaceId);
      cy.get(HomePage.appsContainer).contains(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
      _.agHelper.Sleep(2000);
      _.agHelper.AssertElementAbsence(_.dataSources._addNewDataSource);
      _.onboarding.closeIntroModal();
      PageList.AddNewPage("Generate page with data");
      _.agHelper.GetNClick(_.dataSources._selectDatasourceDropdown);
      cy.get(_.dataSources._dropdownOption).should(
        "not.contain",
        "Connect new datasource",
      );
      EditorNavigation.SelectEntityByName("Postgres", EntityType.Datasource);
      cy.get(_.dataSources._createQuery).should("not.have.attr", "disabled");
      _.agHelper.Sleep(2000);
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
      _.agHelper.Sleep(2000);
      _.agHelper.ClickButton("Share");
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(RBAC.dropdownOption)
        .should("have.length", 2)
        .should("contain.text", `App Viewer`, `Developer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
      _.homePage.NavigateToHome();
      _.homePage.SelectWorkspace(workspaceId);
      _.agHelper.AssertElementAbsence(_.homePage._appHoverIcon("edit"));
      _.agHelper.AssertElementAbsence(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.AssertElementAbsence(HomePage.optionsIcon);

      _.homePage.LogOutviaAPI();
    });

    it("9. Login as Administrator and change app level access for user 1 to App Viewer and verify", () => {
      _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      _.homePage.SelectWorkspace(workspaceId);
      _.agHelper.GetNClick(HomePage.optionsIcon);
      _.agHelper.GetNClick(_.homePage._visibleTextSpan("Members"));
      _.agHelper.TypeText(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      _.agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      _.agHelper.AssertElementExist(`.resource-name:contains(${appid})`);

      cy.xpath(RBAC.optionDeveloper).first().click({ force: true });
      _.agHelper.Sleep();
      _.agHelper.AssertElementAbsence(RBAC.optionAdministrator);
      _.agHelper.AssertElementExist(RBAC.optionDeveloper);
      _.agHelper.AssertElementExist(RBAC.optionAppViewer);
      cy.xpath(RBAC.optionAppViewer).last().parent("div").click();
      _.agHelper.Sleep();
      _.agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      _.agHelper.AssertElementVisibility(RBAC.optionAppViewer);
      _.homePage.LogOutviaAPI();

      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(HomePage.appsContainer).contains(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementAbsence(_.homePage._appHoverIcon("edit"));
      _.agHelper.AssertElementAbsence(HomePage.optionsIcon);
      _.homePage.LaunchAppFromAppHover();
      _.agHelper.Sleep(2000);
      _.agHelper.GetNClick(AppNavigation.shareButton);
      _.agHelper.Sleep();
      _.agHelper.GetNClick(HomePage.selectRole);
      // app level
      cy.get(RBAC.dropdownOption)
        .should("have.length", 1)
        .should("contain.text", `App Viewer`);
      _.agHelper.AssertElementAbsence(HomePage.manageUsers);
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.homePage.LogOutviaAPI();
    });

    it("10. Login as Administrator and delete app level access for user 1", () => {
      _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      _.homePage.SelectWorkspace(workspaceId);
      _.agHelper.GetNClick(HomePage.optionsIcon);
      _.agHelper.GetNClick(_.homePage._visibleTextSpan("Members"));
      _.agHelper.TypeText(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight)
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
      _.agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
      _.agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
      cy.get(HomePage.DeleteBtn).first().click({ force: true });
      cy.get(HomePage.leaveWorkspaceConfirmModal).should("be.visible");
      cy.get(HomePage.leaveWorkspaceConfirmButton).click({ force: true });

      _.agHelper.TypeText(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(RBAC.searchHighlight).should("not.exist");
      _.homePage.LogOutviaAPI();
    });
  },
);
