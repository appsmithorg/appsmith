import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import HomePage from "../../../../locators/HomePage";
let workspaceId: any, appid: any;
const agHelper = ObjectsRegistry.AggregateHelper,
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
      homePage.InviteUserToWorkspaceErrorMessage(workspaceId, "abcdef");
      cy.visit("/applications");
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

  it("2. Login as Administrator and search for users using search bar", () => {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    cy.xpath("//span[text()='Share']/parent::button").first().click();
    cy.xpath(homePage._visibleTextSpan("MANAGE USERS")).click({
      force: true,
    });
    cy.get(".search-highlight").should("not.exist");
    cy.get("[data-testid=t--search-input").type(Cypress.env("TESTUSERNAME1"), {
      delay: 300,
    });
    cy.get(".search-highlight").should("exist");
    cy.get(".search-highlight").contains(Cypress.env("TESTUSERNAME1"));
    homePage.LogOutviaAPI();
  });

  it("3. Login as Invited user and validate Viewer role", function() {
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

  it("4. Login as Workspace owner and Update the Invited user role to Developer", function() {
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

  it("5. Login as Invited user and validate Developer role", function() {
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

  it("6. Login as Workspace owner and Update the Invited user role to Administrator", function() {
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

  it("7. Login as Invited user and validate Administrator role", function() {
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

  it("8. Login as Workspace owner and verify all 3 users are present", function() {
    homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    homePage.FilterApplication(appid, workspaceId);
    homePage.UpdateUserRoleInWorkspace(
      workspaceId,
      Cypress.env("TESTUSERNAME1"),
      "Administrator",
      "Developer",
    );
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

  it("9. Login as Developer, Verify leave workspace flow", () => {
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
  });
});
