const RBAC = require("../../../../../locators/RBAClocators.json");
import { homePage } from "../../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";

describe("Roles tab Tests", { tags: ["@tag.AccessControl"] }, function () {
  let workspaceName;
  let newWorkspaceName;
  let appName;
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 100)}`;

  before(() => {
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.AddIntercepts();
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    homePage.NavigateToHome();
    cy.generateUUID().then((uid) => {
      workspaceName = uid;
      appName = uid + "app";
      localStorage.setItem("WorkspaceName", workspaceName);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        homePage.RenameWorkspace(newWorkspaceName, workspaceName);
      });
      cy.CreateAppForWorkspace(workspaceName, appName);
    });
  });
  it("Verify Functionality of Roles Tab", function () {
    //add the role name
    //check the role is created
    cy.visit("/settings/roles");
    featureFlagIntercept({ license_gac_enabled: true });
    cy.wait(2000);
    cy.get(RBAC.rolesTab).click();
    cy.get(RBAC.addButton).click();
    // add ui assertions
  });
});
