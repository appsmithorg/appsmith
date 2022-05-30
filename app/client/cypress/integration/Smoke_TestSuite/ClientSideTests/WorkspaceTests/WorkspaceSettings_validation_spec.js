/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";

describe("Workspace Settings validation spec", function() {
  let workspaceId;
  let newWorkspaceName;

  it("create workspace with long name should use ellipsis validation", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId =
        "kadjhfkjadsjkfakjdscajdsnckjadsnckadsjcnanakdjsnckjdscnakjdscnnadjkncakjdsnckjadsnckajsdfkjadshfkjsdhfjkasdhfkjasdhfjkasdhjfasdjkfhjhdsfjhdsfjhadasdfasdfadsasdf" +
        uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      // create workspace with long name
      cy.createWorkspace();
      // stub the response and
      // find app name
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
        cy.navigateToWorkspaceSettings(workspaceId);
        // checking parent's(<a></a>) since the child(<span>) inherits css from it
        cy.get(homePage.workspaceHeaderName)
          .parent()
          .then((elem) => {
            assert.isBelow(elem[0].offsetWidth, elem[0].scrollWidth);
          })
          .should("have.css", "text-overflow", "ellipsis");
      });
    });
    cy.LogOut();
  });
});
