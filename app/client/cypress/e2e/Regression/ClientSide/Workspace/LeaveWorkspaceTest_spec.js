/// <reference types="Cypress" />
import {
  agHelper,
  assertHelper,
  homePage,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";

describe(
  "Leave workspace test spec",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let newWorkspaceName;

    it("1. Only admin user can not leave workspace validation", function () {
      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        newWorkspaceName = "LeaveWs" + uid;
        homePage.CreateNewWorkspace(newWorkspaceName);
        cy.get(homePage._homeIcon).click({ force: true });
        homePage.SelectWorkspace(newWorkspaceName);
        homePage.OpenWorkspaceOptions(newWorkspaceName);
        // verify leave workspace is visible
        agHelper.ContainsNClick("Leave workspace");
        agHelper.ContainsNClick("Are you sure");
        assertHelper.AssertNetworkStatus("@leaveWorkspaceApiCall", 400);
        agHelper.AssertContains(newWorkspaceName);
      });
    });

    it("2. Bug 17235 & 17987 - Non admin users can only access leave workspace popup menu validation", function () {
      if (CURRENT_REPO === REPO.EE) adminSettings.EnableGAC(false, true);
      homePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
        false,
      );
      homePage.LogOutviaAPI();

      cy.LoginFromAPI(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      agHelper.AssertContains(newWorkspaceName);
      homePage.SelectWorkspace(newWorkspaceName, false);
      homePage.LeaveWorkspace(newWorkspaceName);
    });
  },
);
