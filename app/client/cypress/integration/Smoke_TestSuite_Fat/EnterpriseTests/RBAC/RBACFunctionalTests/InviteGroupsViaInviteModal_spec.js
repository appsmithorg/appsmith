import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import HomePage from "../../../../../locators/HomePage";
import locators from "../../../../../locators/AuditLogsLocators";
let workspaceId, appid;
const agHelper = ObjectsRegistry.AggregateHelper,
  homePage = ObjectsRegistry.HomePage;

describe("Create new workspace and invite user & validate all roles", () => {
  const GroupName = "group1" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.AddIntercepts();
    cy.visit("/applications");
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.createGroupAndAddUser(
      GroupName,
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTUSERNAME2"),
    );
  });

  it("1. Create new Workspace, Share with a group from UI & verify", () => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = uid;
      appid = uid;
      //localStorage.setItem("WorkspaceName", workspaceId);
      homePage.CreateNewWorkspace(workspaceId);
      homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      cy.InviteGroupToWorkspace(workspaceId, GroupName, "App Viewer");
      cy.xpath(homePage._visibleTextSpan("MANAGE USERS")).click({
        force: true,
      });
      homePage.NavigateToHome();
      homePage.CreateAppInWorkspace(workspaceId, appid);
      homePage.LogOutviaAPI();
    });
  });

  it("2. Login as Workspace owner and verify redirection for Assign custom role in invite modal dropdown", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    agHelper.AssertElementVisible(
      ".t--workspace-section:contains(" + workspaceId + ")",
    );
    agHelper.GetNClick(
      ".t--workspace-section:contains(" +
        workspaceId +
        ") button:contains('Share')",
      0,
      true,
    );
    cy.xpath("//span[text()='Select a role']/ancestor::div")
      .first()
      .click({ force: true });
    agHelper.Sleep(500);
    cy.xpath("//span[text()='Assign Custom Role']").click({ force: true });
    cy.url().should("contain", "/settings/groups");
    homePage.LogOutviaAPI();
  });

  it("3. Login as a user from the Invited group and validate Viewer role", function() {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage._appHoverIcon("edit")).should("not.exist");
    // verify only viewer role is visible
    cy.xpath("//span[text()='Share']")
      .first()
      .click();
    // click on selet a role
    cy.wait(2000);
    cy.xpath(HomePage.selectRole).click();
    cy.get(".t--dropdown-option")
      .should("have.length", 1)
      .and("contain.text", `App Viewer`);
    cy.get(HomePage.closeBtn).click();
    homePage.LaunchAppFromAppHover();
    homePage.LogOutviaAPI();
  });

  it("4. Login as Workspace owner and Update the Invited group role to Developer", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      GroupName,
      "App Viewer",
      "Developer",
    );
    homePage.LogOutviaAPI();
  });

  it("5. Login as a user from the Invited group and validate Developer role", function() {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
      "Developer",
    );
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage._appHoverIcon("edit"))
      .first()
      .click({ force: true });
    // cy.xpath(homePage._editPageLanding).should("exist");
    cy.wait(4000);
    cy.xpath("//span[text()='SHARE']").click();
    cy.wait(2000);
    cy.xpath(HomePage.selectRole).click();
    cy.get(".t--dropdown-option")
      .should("have.length", 2)
      .and("contain.text", `App Viewer`, `Developer`);
    cy.get(HomePage.editModeInviteModalCloseBtn).click();
    homePage.LogOutviaAPI();
  });

  it("6. Login as Workspace owner and Update the Invited user group to Administrator", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      GroupName,
      "Developer",
      "Administrator",
    );
    homePage.LogOutviaAPI();
  });

  it("7. Login as a user from the Invited group and validate Administrator role", function() {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Administrator",
    );
    homePage.InviteUserToWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME2"),
      "App Viewer",
    );
    cy.get(HomePage.closeBtn).click();
    cy.wait(2000);
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage._appHoverIcon("edit"))
      .first()
      .click({ force: true });
    // cy.xpath(homePage._editPageLanding).should("exist");
    cy.wait(4000);
    cy.xpath("//span[text()='SHARE']").click();
    cy.wait(2000);
    cy.xpath(HomePage.selectRole).click();
    cy.get(".t--dropdown-option")
      .should("have.length", 3)
      .should("contain.text", `App Viewer`, `Developer`);
    cy.get(".t--dropdown-option").should("contain.text", `Administrator`);
    cy.get(HomePage.editModeInviteModalCloseBtn).click();
    homePage.LogOutviaAPI();
  });

  it("8. Login as Workspace owner and verify all 3 members are present", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      GroupName,
      "Administrator",
      "Developer",
    );
    homePage.FilterApplication(appid, workspaceId);
    homePage.OpenMembersPageForWorkspace(workspaceId);
    cy.get(homePage._usersEmailList).then(function($list) {
      expect($list).to.have.length(3);
      expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
      expect($list.eq(1)).to.contain(GroupName);
      expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
    });
    homePage.NavigateToHome();
  });

  /*it("9. Login as Developer, Verify leave workspace flow", () => {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    homePage.FilterApplication(appid, workspaceId);
    homePage.leaveWorkspace(workspaceId);
    homePage.LogOutviaAPI();
  });

  it("10. Login as App Viewer, Verify leave workspace flow", () => {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    homePage.FilterApplication(appid, workspaceId);
    homePage.leaveWorkspace(workspaceId);
    homePage.LogOutviaAPI();
  });*/

  after(() => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/groups");
    cy.DeleteGroup(GroupName);
  });
});
