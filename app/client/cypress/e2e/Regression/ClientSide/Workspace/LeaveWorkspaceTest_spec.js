/// <reference types="Cypress" />
import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Leave workspace test spec",
  { tags: ["@tag.Workspace"] },
  function () {
    let newWorkspaceName;

    it("1. Only admin user can not leave workspace validation", function () {
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        newWorkspaceName = "LeaveWs" + uid;
        homePage.CreateNewWorkspace(newWorkspaceName);
        cy.get(homePage._homeIcon).click({ force: true });
        homePage.SelectWorkspace(newWorkspaceName);
        homePage.OpenWorkspaceOptions(newWorkspaceName);
        // verify leave workspace is visible
        cy.contains("Leave workspace").click();
        cy.contains("Are you sure").click();
        cy.wait("@leaveWorkspaceApiCall")
          .its("response.body.responseMeta.status")
          .should("eq", 400);
        cy.contains(newWorkspaceName);
      });
    });

    it("2. Bug 17235 & 17987 - Non admin users can only access leave workspace popup menu validation", function () {
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.LogOutviaAPI();
      homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        newWorkspaceName = "LeaveW" + uid;
        homePage.CreateNewWorkspace(newWorkspaceName);
        homePage.InviteUserToWorkspace(
          newWorkspaceName,
          Cypress.env("TESTUSERNAME1"),
          "App Viewer",
        );

        homePage.LogintoApp(
          Cypress.env("TESTUSERNAME1"),
          Cypress.env("TESTPASSWORD1"),
          "App Viewer",
        );
        agHelper.VisitNAssert("/applications", "getAllWorkspaces");
        homePage.SelectWorkspace(newWorkspaceName);
        homePage.LeaveWorkspace(newWorkspaceName);
      });
    });
  },
);
