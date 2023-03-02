/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Delete workspace test spec", function() {
  let newWorkspaceName;

  it("1. Should delete the workspace", function() {
    cy.visit("/applications");
    cy.generateUUID().then((uid) => {
      newWorkspaceName = uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      cy.wait(500);
      cy.contains("Delete Workspace").click();
      cy.contains("Are you sure").click();
      cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(200);
      });
      cy.get(newWorkspaceName).should("not.exist");
    });
  });

  it("2. Should show option to delete workspace for an admin user", function() {
    cy.visit("/applications");
    cy.wait(2000);
    cy.generateUUID().then((uid) => {
      newWorkspaceName = uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      cy.wait(500);
      cy.contains("Delete Workspace");
      _.homePage.InviteUserToWorkspace(
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
