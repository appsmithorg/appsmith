import { agHelper, homePage } from "../../../../../support/Objects/ObjectsCore";
import homePageLocators from "../../../../../locators/HomePage";
import locators from "../../../../../locators/AuditLogsLocators";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
const RBAC = require("../../../../../locators/RBAClocators.json");
let workspaceId, appid;

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
      cy.get(locators.AdminSettingsEntryLink).should("be.visible");
      cy.get(locators.AdminSettingsEntryLink).click();
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
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
        featureFlagIntercept({ license_gac_enabled: true });
        cy.wait(2000);
        workspaceId = uid;
        appid = uid;
        //localStorage.setItem("WorkspaceName", workspaceId);
        homePage.CreateNewWorkspace(workspaceId);
        homePage.CheckWorkspaceShareUsersCount(workspaceId, 1);
        cy.InviteGroupToWorkspace(workspaceId, GroupName, "App Viewer");
        cy.xpath(homePage._visibleTextSpan("Manage users")).click({
          force: true,
        });
        homePage.NavigateToHome();
        homePage.SelectWorkspace(workspaceId);
        homePage.CreateAppInWorkspace(workspaceId, appid);
        homePage.LogOutviaAPI();
      });
    });

    it("2. Login as Workspace owner and verify redirection for Assign custom role in invite modal dropdown", () => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));

      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.SelectWorkspace(workspaceId);
      agHelper.AssertElementVisibility(
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

    it("3. Login as a user from the Invited group and validate Viewer role", function () {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
      homePage.SelectWorkspace(workspaceId);
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(3000);
      homePage.SelectWorkspace(workspaceId);
      cy.get(homePage._applicationCard).first().trigger("mouseover");
      cy.get(homePage._appHoverIcon("edit")).should("not.exist");
      // verify only viewer role is visible
      agHelper.GetNClick(homePage._shareWorkspace(workspaceId));
      // click on selet a role
      agHelper.Sleep(2000);
      cy.get(homePageLocators.selectRole).click();
      cy.get(".rc-select-item-option-content")
        .should("have.length", 1)
        .and("contain.text", `App Viewer`);
      agHelper.GetNClick(homePageLocators.closeBtn);
      homePage.LaunchAppFromAppHover();
      homePage.Signout(false);
    });

    it("4. Login as Workspace owner and Update the Invited group role to Developer", function () {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.SelectWorkspace(workspaceId);
      homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        GroupName,
        "App Viewer",
        "Developer",
      );
      homePage.LogOutviaAPI();
    });

    it("5. Login as a user from the Invited group and validate Developer role", function () {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
        "Developer",
      );

      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.SelectWorkspace(workspaceId);
      cy.get(homePage._applicationCard).first().trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));

      agHelper.GetNClick(homePage._shareWorkspace(workspaceId));
      agHelper.Sleep(2000);
      cy.get(homePageLocators.selectRole).click();
      cy.get(".rc-select-item-option-content")
        .should("have.length", 2)
        .and("contain.text", `App Viewer`, `Developer`);
      agHelper.GetNClick(homePageLocators.closeBtn);

      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      homePage.Signout(true);
    });

    it("6. Login as Workspace owner and Update the Invited user group to Administrator", function () {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      homePage.SelectWorkspace(workspaceId);
      cy.wait(2000);
      homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        GroupName,
        "Developer",
        "Administrator",
      );
      homePage.LogOutviaAPI();
    });

    it("7. Login as a user from the Invited group and validate Administrator role", function () {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "Administrator",
      );
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.SelectWorkspace(workspaceId);

      homePage.InviteUserToWorkspace(
        workspaceId,
        Cypress.env("TESTUSERNAME2"),
        "App Viewer",
      );
      cy.get(homePageLocators.closeBtn).click();
      cy.wait(2000);

      cy.get(homePage._applicationCard).first().trigger("mouseover");
      agHelper.AssertElementExist(homePage._appHoverIcon("edit"));

      agHelper.GetNClick(homePage._shareWorkspace(workspaceId));
      agHelper.Sleep(2000);
      cy.get(homePageLocators.selectRole).click();
      cy.get(".rc-select-item-option-content")
        .should("have.length", 3)
        .should("contain.text", `App Viewer`, `Developer`);
      cy.get(".rc-select-item-option-content").should(
        "contain.text",
        `Administrator`,
      );
      agHelper.GetNClick(homePageLocators.closeBtn);

      agHelper.GetNClick(homePage._appHoverIcon("edit"));
      homePage.LogOutviaAPI();
    });

    it("8. Login as Workspace owner and verify all 3 members are present", function () {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.SelectWorkspace(workspaceId);
      homePage.UpdateUserRoleInWorkspace(
        workspaceId,
        GroupName,
        "Administrator",
        "Developer",
      );
      homePage.SelectWorkspace(workspaceId);
      homePage.OpenMembersPageForWorkspace(workspaceId);
      cy.get(homePage._usersEmailList).then(function ($list) {
        expect($list).to.have.length(3);
        expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
        expect($list.eq(1)).to.contain(GroupName);
        expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
      });
      agHelper.AssertElementAbsence(RBAC.arrowRightMembersPage);
      homePage.NavigateToHome();
    });

    /*
  Group users are not allowed to leave workspace because they were not invited individually, they have to be removed from the group in order to leave the workspace. An error toast message occurs if they try to leave the group

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
  });*/

    after(() => {
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      agHelper.VisitNAssert("settings/groups", "fetchGroups");
      cy.DeleteGroup(GroupName);
    });
  },
);
