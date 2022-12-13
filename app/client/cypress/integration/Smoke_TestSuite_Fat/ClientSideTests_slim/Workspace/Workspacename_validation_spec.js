/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";

describe("Workspace name validation spec", function() {
  let workspaceId;
  let newWorkspaceName;
  it("create workspace with leading space validation", function() {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.NavigateToHome();
      cy.get(".t--applications-container")
        .contains(newWorkspaceName)
        .closest(homePage.workspaceCompleteSection)
        .find(homePage.workspaceNamePopover)
        .find(homePage.optionsIcon)
        .click({ force: true });
      cy.get(homePage.renameWorkspaceInput)
        .should("be.visible")
        .type(" ");
      cy.get(".error-message").should("be.visible");
    });
  });
  it("creates workspace and checks that workspace name is editable", function() {
    cy.createWorkspace();
    cy.generateUUID().then((uid) => {
      workspaceId =
        "kadjhfkjadsjkfakjdscajdsnckjadsnckadsjcnanakdjsnckjdscnakjdscnnadjkncakjdsnckjadsnckajsdfkjadshfkjsdhfjkasdhfkjasdhfjkasdhjfasdjkfhjhdsfjhdsfjhadasdfasdfadsasdf" +
        uid;
      // create workspace with long name
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
      });
    });
  });
  it("create workspace with special characters validation", function() {
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.renameWorkspace(newWorkspaceName, "Test & Workspace");
    });
  });
});
