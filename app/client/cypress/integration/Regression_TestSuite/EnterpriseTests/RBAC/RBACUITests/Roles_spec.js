const RBAC = require("../../../../../locators/RBAClocators.json");
import homePage from "../../../../../locators/HomePage";

describe("Roles tab Tests", function() {
  let workspaceName;
  let newWorkspaceName;
  let appName;
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 100)}`;

  before(() => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.AddIntercepts();
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid + "app";
      localStorage.setItem("WorkspaceName", workspaceName);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);
    });
  });
  it("Verify Functionality of Roles Tab", function() {
    //add the role name
    //check the role is created
    cy.visit("/settings/roles");
    cy.wait(2000);
    cy.get(RBAC.rolesTab).click();
    cy.get(RBAC.addButton).click();
    // add ui assertions
  });
});
