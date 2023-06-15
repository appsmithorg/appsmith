import {
  agHelper,
  entityExplorer,
  homePage,
  dataSources,
  onboarding,
} from "../../../../../support/Objects/ObjectsCore";
import homePageLocators from "../../../../../locators/HomePage";
import auditLogslocators from "../../../../../locators/AuditLogsLocators";
const AppNavigation = require("../../../../../locators/AppNavigation.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const Explorer = require("../../../../../locators/explorerlocators.json");
let workspaceId, appid;

describe("Create new workspace and invite group & validate all roles", () => {
  const GroupName = "group1" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.AddIntercepts();
    agHelper.VisitNAssert("/applications", "getReleaseItems");
    agHelper.GetNClick(auditLogslocators.AdminSettingsEntryLink);
    cy.createGroupAndAddUser(
      GroupName,
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTUSERNAME2"),
    );
  });

  it("1. Create new Workspace, Share App Viewer workspace level access with a group", () => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = uid;
      appid = uid;
      homePage.CreateNewWorkspace(workspaceId);
      homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      agHelper.VisitNAssert("/applications", "getReleaseItems");
      cy.InviteGroupToWorkspace(workspaceId, GroupName, "Developer");
      agHelper.GetNClick(homePage._visibleTextSpan("Manage Users"));
      homePage.NavigateToHome();
      homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      homePage.CreateAppInWorkspace(workspaceId, appid);
      homePage.NavigateToHome();
      homePage.CreateAppInWorkspace(workspaceId, appid + "Internal Apps");
    });
    homePage.LogOutviaAPI();
  });

  it("2. Share Developer application level access with group", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.NavigateToHome();
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
    agHelper.GetNClick(homePage._appHoverIcon("edit"));
    agHelper.Sleep(2000);
    dataSources.CreateDataSource("Postgres");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Share");
    agHelper.Sleep();
    agHelper.GetNClick(homePageLocators.selectRole);
    cy.get(RBAC.dropdownOption)
      .should("have.length", 3)
      .should("contain.text", `App Viewer`, `Developer`);
    cy.get(RBAC.dropdownOption).should("contain.text", `Assign Custom Role`);
    cy.InviteGroupToApplication(GroupName, "Developer");
    agHelper.GetNClick(homePage._visibleTextSpan("Manage Users"));
    agHelper.UpdateInput(homePage._searchUsersInput, GroupName);
    cy.get(RBAC.searchHighlight).should("exist").contains(GroupName);
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
    cy.get(homePageLocators.searchInput).type(appid);
    agHelper.Sleep(2000);
    cy.get(homePageLocators.appsContainer).contains(workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
    agHelper.GetNClick(homePage._appHoverIcon("edit"));
    agHelper.Sleep(2000);
    onboarding.closeIntroModal();
    agHelper.AssertElementExist(dataSources._addNewDataSource);
    entityExplorer.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    cy.get(dataSources._dropdownOption).should(
      "contain",
      "Connect new datasource",
    );
    agHelper.GetNClick(Explorer.entityQuery);
    agHelper.GetNClick(".t--entity-name:contains('Postgres')");
    cy.get(dataSources._createQuery).should("not.have.attr", "disabled");
    agHelper.ClickButton("Share");
    agHelper.Sleep();
    agHelper.GetNClick(homePageLocators.selectRole);
    cy.get(RBAC.dropdownOption)
      .should("have.length", 2)
      .should("contain.text", `App Viewer`, `Developer`);
    agHelper.AssertElementAbsence(homePageLocators.manageUsers);
    agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
    homePage.NavigateToHome();
    homePage.FilterApplication(appid + "Internal Apps", workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
    agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
    agHelper.AssertElementExist(homePageLocators.optionsIcon);
    homePage.LogOutviaAPI();
  });

  it("4. Login as Administrator and change workspace level access for group to App Viewer and verify", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
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
    cy.get(homePageLocators.searchInput).type(appid);
    agHelper.Sleep(2000);
    cy.get(homePageLocators.appsContainer).contains(workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
    agHelper.GetNClick(homePage._appHoverIcon("edit"));
    agHelper.Sleep(2000);
    onboarding.closeIntroModal();
    agHelper.AssertElementAbsence(dataSources._addNewDataSource);
    entityExplorer.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    cy.get(dataSources._dropdownOption).should(
      "not.contain",
      "Connect new datasource",
    );
    agHelper.GetNClick(Explorer.entityQuery);
    agHelper.GetNClick(".t--entity-name:contains('Postgres')");
    cy.get(dataSources._createQuery).should("not.have.attr", "disabled");
    agHelper.ClickButton("Share");
    agHelper.Sleep();
    agHelper.GetNClick(homePageLocators.selectRole);
    cy.get(RBAC.dropdownOption)
      .should("have.length", 2)
      .should("contain.text", `App Viewer`, `Developer`);
    agHelper.AssertElementAbsence(homePageLocators.manageUsers);
    agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
    homePage.NavigateToHome();
    homePage.FilterApplication(appid + "Internal Apps", workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
    agHelper.AssertElementExist(homePage._shareWorkspace(workspaceId));
    agHelper.AssertElementExist(homePageLocators.optionsIcon);
    homePage.LogOutviaAPI();
  });

  it("6. Login as Administrator and delete workspace level role for group", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.DeleteUserFromWorkspace(appid, workspaceId, GroupName);
    agHelper.UpdateInput(homePage._searchUsersInput, GroupName);
    cy.get(RBAC.searchHighlight).should("exist").contains(GroupName);
    agHelper.AssertElementAbsence(homePageLocators.DeleteBtn);
    cy.get("table").contains("td", "No Access");
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
    cy.get(homePageLocators.searchInput).type(appid);
    agHelper.Sleep(2000);
    cy.get(homePageLocators.appsContainer).contains(workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementExist(homePage._appHoverIcon("edit"));
    agHelper.GetNClick(homePage._appHoverIcon("edit"));
    agHelper.Sleep(2000);
    onboarding.closeIntroModal();
    agHelper.AssertElementAbsence(dataSources._addNewDataSource);
    entityExplorer.AddNewPage("Generate page with data");
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    cy.get(dataSources._dropdownOption).should(
      "not.contain",
      "Connect new datasource",
    );
    agHelper.GetNClick(Explorer.entityQuery);
    agHelper.GetNClick(".t--entity-name:contains('Postgres')");
    cy.get(dataSources._createQuery).should("not.have.attr", "disabled");
    agHelper.Sleep(2000);
    agHelper.ClickButton("Share");
    agHelper.Sleep();
    agHelper.GetNClick(homePageLocators.selectRole);
    cy.get(RBAC.dropdownOption)
      .should("have.length", 2)
      .should("contain.text", `App Viewer`, `Developer`);
    agHelper.AssertElementAbsence(homePageLocators.manageUsers);
    agHelper.GetNClick(homePageLocators.editModeInviteModalCloseBtn);
    homePage.NavigateToHome();
    agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
    agHelper.AssertElementAbsence(homePage._shareWorkspace(workspaceId));
    agHelper.AssertElementAbsence(homePageLocators.optionsIcon);
    cy.get(homePageLocators.searchInput).type(appid + "Internal Apps");
    agHelper.Sleep(2000);
    cy.get(homePageLocators.appsContainer).should("not.contain", workspaceId);
    agHelper.AssertElementAbsence(".t--workspace-section");
    homePage.LogOutviaAPI();
  });

  it("8. Login as Administrator and change app level access for group to App Viewer and verify", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    agHelper.GetNClick(homePageLocators.optionsIcon);
    agHelper.GetNClick(homePage._visibleTextSpan("Members"));
    agHelper.UpdateInput(homePage._searchUsersInput, GroupName);
    cy.get(RBAC.searchHighlight).should("exist").contains(GroupName);
    agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
    agHelper.AssertElementExist(`.resource-name:contains(${appid})`);

    cy.xpath(RBAC.optionDeveloper).first().click({ force: true });
    agHelper.Sleep();
    agHelper.AssertElementAbsence(RBAC.optionAdministrator);
    agHelper.AssertElementExist(RBAC.optionDeveloper);
    agHelper.AssertElementExist(RBAC.optionAppViewer);
    cy.xpath(RBAC.optionAppViewer).last().parent("div").click();
    agHelper.Sleep();
    agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
    agHelper.AssertElementVisible(RBAC.optionAppViewer);
    homePage.LogOutviaAPI();

    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    cy.get(homePageLocators.searchInput).type(appid);
    agHelper.Sleep(2000);
    cy.get(homePageLocators.appsContainer).contains(workspaceId);
    cy.get(homePage._applicationCard).first().trigger("mouseover");
    agHelper.AssertElementAbsence(homePage._appHoverIcon("edit"));
    agHelper.AssertElementAbsence(homePageLocators.optionsIcon);
    homePage.LaunchAppFromAppHover();
    agHelper.Sleep(2000);
    agHelper.GetNClick(AppNavigation.shareButton);
    agHelper.Sleep();
    agHelper.GetNClick(homePageLocators.selectRole);
    // app level
    cy.get(RBAC.dropdownOption)
      .should("have.length", 1)
      .should("contain.text", `App Viewer`);
    agHelper.AssertElementAbsence(homePageLocators.manageUsers);
    agHelper.GetNClick(homePageLocators.closeBtn, 0, true);
    homePage.LogOutviaAPI();
  });

  it("9. Login as Administrator and delete app level access for group", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    agHelper.GetNClick(homePageLocators.optionsIcon);
    agHelper.GetNClick(homePage._visibleTextSpan("Members"));
    agHelper.UpdateInput(homePage._searchUsersInput, GroupName);
    cy.get(RBAC.searchHighlight).should("exist").contains(GroupName);
    agHelper.GetNClick(RBAC.arrowRightMembersPage, 0, true);
    agHelper.AssertElementExist(`.resource-name:contains(${appid})`);
    cy.get(homePageLocators.DeleteBtn).first().click({ force: true });
    cy.get(homePageLocators.leaveWorkspaceConfirmModal).should("be.visible");
    cy.get(homePageLocators.leaveWorkspaceConfirmButton).click({ force: true });

    agHelper.UpdateInput(homePage._searchUsersInput, GroupName);
    cy.get(RBAC.searchHighlight).should("not.exist");
    homePage.LogOutviaAPI();
  });

  after(() => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.VisitNAssert("settings/groups", "fetchGroups");
    cy.DeleteGroup(GroupName);
  });
});
