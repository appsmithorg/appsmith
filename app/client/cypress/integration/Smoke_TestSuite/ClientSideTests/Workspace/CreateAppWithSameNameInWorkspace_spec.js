/// <reference types="Cypress" />

describe("Create workspace and a new app / delete and recreate app", function() {
  let workspaceId;
  let appid;
  let newWorkspaceName;

  it("create app within an workspace and delete and re-create another app with same name", function() {
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      appid = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
      });
      cy.CreateAppForWorkspace(workspaceId, appid);
      cy.DeleteAppByApi();
      cy.NavigateToHome();
      cy.CreateAppForWorkspace(workspaceId, appid);
    });
  });
});
