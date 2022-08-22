/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import homePage from "../../../../locators/HomePage";
let HomePage = ObjectsRegistry.HomePage,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Delete workspace test spec", function() {
  let newWorkspaceName;

  it("should delete the workspace", function() {
    cy.visit("/applications");
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openWorkspaceOptionsPopup(newWorkspaceName);
      cy.contains("Delete Workspace").click();
      cy.contains("Are you sure").click();
      cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(200);
      });
      cy.get(newWorkspaceName).should("not.exist");
    });
  });

  it("should show option to delete workspace for an admin user", function() {
    cy.visit("/applications");
    cy.wait(2000);
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.visit("/applications");
      cy.openWorkspaceOptionsPopup(newWorkspaceName);
      cy.contains("Delete Workspace");
      HomePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      cy.LogOut();
      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.visit("/applications");
      cy.openWorkspaceOptionsPopup(newWorkspaceName);
      cy.get(homePage.workspaceNamePopoverContent)
        .contains("Delete Workspace")
        .should("not.exist");
      cy.LogOut();
    });
  });
});
