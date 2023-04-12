/// <reference types="Cypress" />
import homePage from "../../../../locators/HomePage";
import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import * as _ from "../../../../support/Objects/ObjectsCore";
const application = require("../../../../locators/Applications.json");

describe("Delete workspace test spec", function () {
  let newWorkspaceName;

  it("1. Should delete the workspace", function () {
    cy.visit("/applications");
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      newWorkspaceName = "Deleteworkspace" + uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      _.homePage.DeleteWorkspace(newWorkspaceName);
      cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(200);
      });
      cy.get(newWorkspaceName).should("not.exist");
    });
  });

  it("2. Should show option to delete workspace for an admin user", function () {
    cy.visit("/applications");
    cy.wait(2000);
    cy.generateUUID().then((uid) => {
      newWorkspaceName = uid;
      _.homePage.CreateNewWorkspace(newWorkspaceName);
      cy.wait(500);
      cy.contains(".cs-text", "Delete Workspace"); //only to check if Delete workspace is shown to an admin user
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
      //Automated as part of Bug19506
      if (CURRENT_REPO === REPO.CE) {
        cy.get(homePage.members).click({ force: true });
        cy.get(application.inviteUserMembersPage).click({ force: true });
        cy.xpath(application.placeholderTxt).should("be.visible");
      }
      cy.LogOut();
    });
  });
});
