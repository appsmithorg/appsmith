import HomePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
let workspaceId: any, appid: any;

describe("Create new workspace and invite user & validate all roles", () => {
  it("1. Create new Workspace, Share with a user from UI & verify", () => {
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = uid;
      appid = uid;
      //localStorage.setItem("WorkspaceName", workspaceId);
      _.homePage.CreateNewWorkspace(workspaceId);
      _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      _.homePage.InviteUserToWorkspaceErrorMessage(workspaceId, "abcdef");
      cy.visit("/applications");
      _.homePage.InviteUserToWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      _.agHelper.GetNClick(_.homePage._visibleTextSpan("MANAGE USERS"));
      _.homePage.NavigateToHome();
      _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 2);
      _.homePage.CreateAppInWorkspace(workspaceId, appid);
    });
    _.homePage.LogOutviaAPI();
  });

  it("2. Login as Administrator and search for users using search bar", () => {
    _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    _.homePage.FilterApplication(appid, workspaceId);
    _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
    _.agHelper.GetNClick(_.homePage._visibleTextSpan("MANAGE USERS"));
    cy.get(".search-highlight").should("not.exist");
    _.agHelper.UpdateInput(
      _.homePage._searchUsersInput,
      Cypress.env("TESTUSERNAME1"),
    );
    cy.get(".search-highlight")
      .should("exist")
      .contains(Cypress.env("TESTUSERNAME1"));
    _.homePage.Signout();
  });

  it("3. Login as Invited user and validate Viewer role", function () {
    _.homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "App Viewer",
    );
    _.homePage.FilterApplication(appid, workspaceId);
    cy.get(_.homePage._applicationCard).first().trigger("mouseover");
    cy.get(_.homePage._appHoverIcon("edit")).should("not.exist");
    // verify only viewer role is visible
    _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
    // click on selet a role
    _.agHelper.Sleep(2000);
    cy.xpath(HomePage.selectRole).click();
    cy.get(".t--dropdown-option")
      .should("have.length", 1)
      .and("contain.text", `App Viewer`);
    _.agHelper.GetNClick(HomePage.closeBtn);
    _.homePage.LaunchAppFromAppHover();
    //_.deployMode.NavigateToHomeDirectly();
    _.homePage.Signout(false);
  });

  it("4. Login as Workspace owner and Update the Invited user role to Developer", function () {
    _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "App Viewer",
      "Developer",
    );
    _.homePage.Signout();
  });

  it("5. Login as Invited user and validate Developer role", function () {
    _.homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Developer",
    );
    _.homePage.FilterApplication(appid, workspaceId);
    cy.get(_.homePage._applicationCard).first().trigger("mouseover");
    _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
    // cy.xpath(_.homePage._editPageLanding).should("exist");
    _.agHelper.Sleep(2000);
    _.agHelper.ClickButton("SHARE");
    _.agHelper.Sleep();
    cy.xpath(HomePage.selectRole).click();
    cy.get(".t--dropdown-option")
      .should("have.length", 2)
      .and("contain.text", `App Viewer`, `Developer`);
    _.agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
    _.homePage.Signout();
  });

  it("6. Login as Workspace owner and Update the Invited user role to Administrator", function () {
    _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "Developer",
      "Administrator",
    );
    _.homePage.Signout();
  });

  it("7. Login as Invited user and validate Administrator role", function () {
    _.homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Administrator",
    );
    _.homePage.InviteUserToWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME2"),
      "App Viewer",
    );
    _.agHelper.GetNClick(HomePage.closeBtn);
    _.agHelper.Sleep();
    _.homePage.FilterApplication(appid, workspaceId);
    cy.get(_.homePage._applicationCard).first().trigger("mouseover");
    _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
    // cy.xpath(_.homePage._editPageLanding).should("exist");
    _.agHelper.Sleep(2000);
    _.agHelper.ClickButton("SHARE");
    _.agHelper.Sleep();
    _.agHelper.GetNClick(HomePage.selectRole);
    cy.get(".t--dropdown-option")
      .should("have.length", 3)
      .should("contain.text", `App Viewer`, `Developer`);
    cy.get(".t--dropdown-option").should("contain.text", `Administrator`);
    _.agHelper.GetNClick(HomePage.editModeInviteModalCloseBtn);
    _.homePage.Signout();
  });

  it("8. Login as Workspace owner and verify all 3 users are present", function () {
    _.homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "Administrator",
      "Developer",
    );
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.OpenMembersPageForWorkspace(workspaceId);
    cy.get(_.homePage._usersEmailList).then(function ($list) {
      expect($list).to.have.length(3);
      expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
      expect($list.eq(1)).to.contain(Cypress.env("TESTUSERNAME1"));
      expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
    });
    _.homePage.NavigateToHome();
  });

  it("9. Login as Developer, Verify leave workspace flow", () => {
    _.homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.LeaveWorkspace(workspaceId);
    _.homePage.Signout();
  });

  it("10. Login as App Viewer, Verify leave workspace flow", () => {
    _.homePage.LogintoApp(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
      "App Viewer",
    );
    _.homePage.FilterApplication(appid, workspaceId);
    _.homePage.LeaveWorkspace(workspaceId);
    _.homePage.LogOutviaAPI();
  });
});
