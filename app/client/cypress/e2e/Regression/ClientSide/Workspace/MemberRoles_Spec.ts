import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import HomePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
let workspaceId: any, appid: any;

describe(
  "Create new workspace and invite user & validate all roles",
  { tags: ["@tag.Workspace", "@tag.Sanity", "@tag.AccessControl"] },
  () => {
    it("1. Create new Workspace, Share with a user from UI & verify", () => {
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(true, false);
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceId = uid;
        appid = uid;
        _.homePage.CreateNewWorkspace(workspaceId, true);
        _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        _.homePage.InviteUserToWorkspaceErrorMessage(workspaceId, "abcdef");
        cy.visit("/applications", { timeout: 60000 });
        _.homePage.InviteUserToWorkspace(
          workspaceId,
          Cypress.env("TESTUSERNAME1"),
          "App Viewer",
        );
        _.agHelper.GetNClick(_.homePage._visibleTextSpan("Manage users"));
        _.homePage.NavigateToHome();
        _.homePage.CheckWorkspaceShareUsersCount(workspaceId, 2);
        _.homePage.CreateAppInWorkspace(workspaceId, appid);
      });
    });

    it("2. Login as Administrator and search for users using search bar", () => {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(false, true);
      _.homePage.SelectWorkspace(workspaceId);
      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.GetNClick(_.homePage._visibleTextSpan("Manage users"));
      cy.get(".search-highlight").should("not.exist");
      _.agHelper.TypeText(
        _.homePage._searchUsersInput,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.get(".search-highlight")
        .should("exist")
        .contains(Cypress.env("TESTUSERNAME1"));
    });

    it("3. Login as Invited user and validate Viewer role", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      if (CURRENT_REPO === REPO.EE)
        _.adminSettings.EnableGAC(false, true, "home");
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      cy.get(_.homePage._appHoverIcon("edit")).should("not.exist");
      // verify only viewer role is visible
      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
      // click on selet a role
      _.agHelper.Sleep(2000);
      _.agHelper.GetNClick(HomePage.selectRole);
      cy.get(".rc-select-item-option")
        .should("have.length", 1)
        .and("contain.text", `App Viewer`);
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.homePage.LaunchAppFromAppHover(_.locators._emptyPageTxt);
    });

    it("4. Login as Workspace owner and Update the Invited user role to Developer", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(false, true);
      _.homePage.SelectWorkspace(workspaceId);
      _.homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
        "Developer",
      );
    });

    it("5. Login as Invited user and validate Developer role", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      if (CURRENT_REPO === REPO.EE)
        _.adminSettings.EnableGAC(false, true, "home");
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));

      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.Sleep(2000);
      _.agHelper.GetNClick(HomePage.selectRole);
      if (CURRENT_REPO === REPO.CE) {
        cy.get(".rc-select-item-option")
          .should("have.length", 3)
          .should("contain.text", "App Viewer")
          .should("contain.text", "Developer")
          .should("contain.text", "Custom role");
      } else {
        cy.get(".rc-select-item-option")
          .should("have.length", 2)
          .should("contain.text", "App Viewer")
          .should("contain.text", "Developer");
      }

      _.agHelper.GetNClick(HomePage.closeBtn);
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
    });

    it("6. Login as Workspace owner and Update the Invited user role to Administrator", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(false, true);
      _.homePage.SelectWorkspace(workspaceId);
      _.homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "Developer",
        "Administrator",
      );
    });

    it("7. Login as Invited user and validate Administrator role", function () {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      if (CURRENT_REPO === REPO.EE)
        _.adminSettings.EnableGAC(false, true, "home");
      _.homePage.InviteUserToWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME2"),
        "App Viewer",
        false,
      );
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.agHelper.Sleep();
      _.homePage.SelectWorkspace(workspaceId);
      cy.get(_.homePage._applicationCard).first().trigger("mouseover");
      _.agHelper.AssertElementExist(_.homePage._appHoverIcon("edit"));

      _.agHelper.GetNClick(_.homePage._shareWorkspace(workspaceId));
      _.agHelper.Sleep(2000);
      _.agHelper.GetNClick(HomePage.selectRole);
      if (CURRENT_REPO === REPO.CE) {
        cy.get(".rc-select-item-option")
          .should("have.length", 4)
          .should("contain.text", "Administrator")
          .should("contain.text", "Developer")
          .should("contain.text", "App Viewer")
          .should("contain.text", "Custom role");
      } else {
        cy.get(".rc-select-item-option")
          .should("have.length", 3)
          .should("contain.text", "Administrator")
          .should("contain.text", "Developer")
          .should("contain.text", "App Viewer");
      }
      cy.get(".rc-select-item-option").should("contain.text", `Administrator`);
      _.agHelper.GetNClick(HomePage.closeBtn);
      _.agHelper.GetNClick(_.homePage._appHoverIcon("edit"));
    });

    it("8. Login as Workspace owner and verify all 3 users are present", function () {
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      if (CURRENT_REPO === REPO.EE) _.adminSettings.EnableGAC(false, true);
      _.homePage.SelectWorkspace(workspaceId);
      _.homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME1"),
        "Administrator",
        "Developer",
      );
      _.homePage.SelectWorkspace(workspaceId);
      _.homePage.OpenMembersPageForWorkspace(workspaceId);
      cy.get(_.homePage._usersEmailList).then(function ($list) {
        expect($list).to.have.length(3);
        expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
        expect($list.eq(1)).to.contain(Cypress.env("TESTUSERNAME1"));
        expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
      });
      _.agHelper.AssertElementAbsence("[name='arrow-right-s-fill']");
      _.homePage.NavigateToHome();
    });

    it("9. Login as Developer, Verify leave workspace flow", () => {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      if (CURRENT_REPO === REPO.EE)
        _.adminSettings.EnableGAC(false, true, "home");
      _.homePage.LeaveWorkspace(workspaceId);
    });

    it("10. Login as App Viewer, Verify leave workspace flow", () => {
      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      if (CURRENT_REPO === REPO.EE)
        _.adminSettings.EnableGAC(false, true, "home");
      _.homePage.LeaveWorkspace(workspaceId);
    });
  },
);
