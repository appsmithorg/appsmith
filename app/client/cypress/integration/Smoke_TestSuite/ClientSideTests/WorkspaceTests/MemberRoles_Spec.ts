import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let workspaceId: any, appid: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  homePage = ObjectsRegistry.HomePage;

describe("Create new workspace and invite user & validate all roles", () => {
  it("1. Create new Workspace, Share with a user from UI & verify", () => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = uid;
      appid = uid;
      //localStorage.setItem("WorkspaceName", workspaceId);
      homePage.CreateNewWorkspace(workspaceId);
      homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
      homePage.InviteUserToWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      cy.xpath(homePage._visibleTextSpan("MANAGE USERS")).click({
        force: true,
      });
      homePage.NavigateToHome();
      homePage.CheckWorkspaceShareUsersCount(workspaceId, 2);
      homePage.CreateAppInWorkspace(workspaceId, appid);
    });
    homePage.LogOutviaAPI();
  });

  it("2. Login as Invited user and validate Viewer role", function() {
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
    homePage.LaunchAppFromAppHover();
    homePage.LogOutviaAPI();
  });

  it("3. Login as Workspace owner and Update the Invited user role to Developer", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "App Viewer",
      "Developer",
    );
    homePage.LogOutviaAPI();
  });

  it("4. Login as Invited user and validate Developer role", function() {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Developer",
    );
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage._appHoverIcon("edit"))
      .first()
      .click({ force: true });
    cy.xpath(homePage._editPageLanding).should("exist");
    homePage.LogOutviaAPI();
  });

  it("5. Login as Workspace owner and Update the Invited user role to Administrator", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "Developer",
      "Administrator",
    );
    homePage.LogOutviaAPI();
  });

  it("6. Login as Invited user and validate Administrator role", function() {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
      "Administrator",
    );
    homePage.FilterApplication(appid, workspaceId);
    cy.get(homePage._applicationCard)
      .first()
      .trigger("mouseover");
    homePage.InviteUserToWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME2"),
      "App Viewer",
    );
    homePage.LogOutviaAPI();
  });

  it("7. Login as Workspace owner and verify all 3 users are present", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.OpenMembersPageForWorkspace(workspaceId);
    cy.get(homePage._usersEmailList).then(function($list) {
      expect($list).to.have.length(3);
      expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
      expect($list.eq(1)).to.contain(Cypress.env("TESTUSERNAME1"));
      expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
    });
    homePage.NavigateToHome();
  });
});
