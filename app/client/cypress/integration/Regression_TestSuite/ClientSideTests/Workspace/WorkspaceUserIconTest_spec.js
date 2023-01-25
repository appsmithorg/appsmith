/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";

describe("Check if workspace has user icons on homepage", function() {
  let workspaceId;
  let newWorkspaceName;

  it("create workspace and check if user icons exists in that workspace on homepage", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
        cy.get(homePage.workspaceList.concat(workspaceId).concat(")"))
          .scrollIntoView()
          .should("be.visible")
          .within(() => {
            cy.get(homePage.shareUserIcons)
              .first()
              .should("be.visible");
          });
      });
    });
    cy.LogOut();
  });
});
