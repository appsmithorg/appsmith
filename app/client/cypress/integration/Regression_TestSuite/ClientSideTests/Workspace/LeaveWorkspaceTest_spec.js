/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let HomePage = ObjectsRegistry.HomePage;

describe("Leave workspace test spec", function () {
  let newWorkspaceName;

  it("1. Only admin user can not leave workspace validation", function () {
    cy.visit("/applications");
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openWorkspaceOptionsPopup(newWorkspaceName);
      // verify leave workspace is visible
      cy.contains("Leave Workspace").click();
      cy.contains("Are you sure").click();
      cy.wait("@leaveWorkspaceApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(400);
      });
      cy.contains(newWorkspaceName);
    });
  });

  it("2. Bug 17235 & 17987 - Non admin users can only access leave workspace popup menu validation", function () {
    cy.visit("/applications");
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.visit("/applications");
      HomePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      cy.LogOut();

      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.visit("/applications");
      cy.leaveWorkspace(newWorkspaceName);
    });
  });
});
