/// <reference types="Cypress" />
import homePageLocators from "../../../../locators/HomePage";

import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";

describe("Delete workspace test spec", function () {
  let newWorkspaceName;

  it("1. Should delete the workspace", function () {
    agHelper.VisitNAssert("/applications", "getReleaseItems");
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = "workspace" + uid;
      homePage.CreateNewWorkspace(newWorkspaceName);
      homePage.DeleteWorkspace(newWorkspaceName);
      cy.wait("@deleteWorkspaceApiCall")
        .its("response.body.responseMeta.status")
        .should("eq", 200);
      cy.get(newWorkspaceName).should("not.exist");
    });
  });

  it("2. Should show option to delete workspace for an admin user", function () {
    agHelper.VisitNAssert("/applications", "getReleaseItems");
    cy.wait(2000);
    cy.generateUUID().then((uid) => {
      newWorkspaceName = uid;
      homePage.CreateNewWorkspace(newWorkspaceName);
      cy.wait(500);
      cy.contains("Delete workspace"); //only to check if Delete workspace is shown to an admin user
      homePage.InviteUserToWorkspace(
        newWorkspaceName,
        Cypress.env("TESTUSERNAME1"),
        "App Viewer",
      );
      cy.LogOut();
      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      agHelper.VisitNAssert("/applications", "getReleaseItems");
      cy.openWorkspaceOptionsPopup(newWorkspaceName);
      cy.get(homePageLocators.workspaceNamePopoverContent)
        .contains("Delete workspace")
        .should("not.exist");
      cy.LogOut();
    });
  });
});
