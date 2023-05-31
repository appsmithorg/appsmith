/// <reference types="Cypress" />
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Leave workspace test spec", function () {
  let newWorkspaceName;

  it("1. Only admin user can not leave workspace validation", function () {
    cy.visit("/applications");
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = "LeaveWorkspace" + uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      cy.get(_.homePage._homeIcon).click({ force: true });
      _.homePage.OpenWorkspaceOptions(newWorkspaceName);
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
    cy.visit("/applications");
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = "LeaveWorkspace" + uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      _.homePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );

      _.homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );

      cy.visit("/applications");
      _.homePage.LeaveWorkspace(newWorkspaceName);
    });
  });
});
