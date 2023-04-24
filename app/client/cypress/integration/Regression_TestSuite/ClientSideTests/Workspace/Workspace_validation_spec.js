/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";

describe("Workspace name validation spec", function () {
  let workspaceId;
  let newWorkspaceName;
  it("1. create workspace with leading space validation", function () {
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
      cy.get(homePage.renameWorkspaceInput).should("be.visible").type(" ");
      cy.get(".error-message").should("be.visible");
    });
  });
  it("2. creates workspace and checks that workspace name is editable and create workspace with special characters validation", function () {
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
        // check if user icons exists in that workspace on homepage
        cy.get(homePage.workspaceList.concat(workspaceId).concat(")"))
          .scrollIntoView()
          .should("be.visible")
          .within(() => {
            cy.get(homePage.shareUserIcons).first().should("be.visible");
          });
        cy.navigateToWorkspaceSettings(workspaceId);
        // checking parent's(<a></a>) since the child(<span>) inherits css from it
        cy.get(homePage.workspaceHeaderName).should(
          "have.css",
          "text-overflow",
          "ellipsis",
        );
      });
    });
    cy.NavigateToHome();
    // create workspace with special character
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
      cy.renameWorkspace(newWorkspaceName, "Test & Workspace");
    });
  });
});
