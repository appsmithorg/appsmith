import homePage from "../../../../../locators/HomePage";
import locators from "../../../../../locators/AuditLogsLocators";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Others tab permission Tests", function() {
  let workspaceName;
  let appName;
  let newWorkspaceName;
  const ViewAuditlogsRole =
    "viewAuditLogs" + `${Math.floor(Math.random() * 1000)}`;
  const CreateWorkspaceRole =
    "createRole" + `${Math.floor(Math.random() * 1000)}`;
  const EditWorkspaceRole = "editRole" + `${Math.floor(Math.random() * 1000)}`;
  const DeleteWorkspaceRole =
    "deleteRole" + `${Math.floor(Math.random() * 1000)}`;

  before(() => {
    cy.AddIntercepts();
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
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
      cy.visit("settings/general");
      cy.ViewAuditLogsRole(ViewAuditlogsRole);
      cy.CreateWorkspaceRole(CreateWorkspaceRole);
      cy.EditWorkspaceRole(EditWorkspaceRole, workspaceName);
      cy.DeleteWorkspaceRole(DeleteWorkspaceRole, workspaceName);

      cy.AssignRoleToUser(ViewAuditlogsRole, Cypress.env("TESTUSERNAME1"));
      cy.AssignRoleToUser(CreateWorkspaceRole, Cypress.env("TESTUSERNAME1"));
      cy.AssignRoleToUser(EditWorkspaceRole, Cypress.env("TESTUSERNAME2"));
      cy.AssignRoleToUser(DeleteWorkspaceRole, Cypress.env("TESTUSERNAME3"));
    });
  });

  it("1. Verify user with ViewAuditlogsRole is able to view audit logs", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    // cy.url().should("contain", "/settings/general");
    cy.get(locators.LeftPaneAuditLogsLink).should("be.visible");
    cy.get(locators.LeftPaneAuditLogsLink).click();
    cy.wait("@fetchAuditLogs").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("2. Verify user with ViewAuditlogsRole is able to view audit logs and verify logs", function() {
    cy.get(locators.RowsContainer)
      .children()
      .should("have.length.greaterThan", 1)
      .first()
      .children()
      .then((firstRow) => {
        cy.wrap(firstRow)
          .children()
          .should("have.length", 3)
          .first()
          .text()
          .should("contain.text", `${Cypress.env("TESTUSERNAME1")} logged in`);
      });
  });

  it("3. Verify user with CreateWorkspaceRole is able to create new workspace ", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
    });
  });

  it("4. Verify user with EditWorkspaceRole is able to edit workspace ", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.visit("/applications");
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.get(homePage.workspaceNamePopoverContent)
      .find("a")
      .should("have.length", 5);
  });

  it("5. Verify user with EditWorkspaceRole is able to edit workspace name ", function() {
    cy.navigateToWorkspaceSettings(workspaceName);
    cy.get(RBAC.generalTab).click();
    cy.get(homePage.workspaceNameInput).click({ force: true });
    cy.get(homePage.workspaceNameInput).clear();
    cy.get(homePage.workspaceNameInput).type(`${workspaceName} edited`);
    cy.wait(2000);
    cy.get(homePage.workspaceHeaderName).should(
      "have.text",
      `Members in ${workspaceName} edited`,
    );
    cy.get(RBAC.generalTab).click();
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceNameInput).click({ force: true });
    cy.get(homePage.workspaceNameInput).clear();
    cy.get(homePage.workspaceNameInput).type(workspaceName);
    cy.get(RBAC.generalTab).click();
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceHeaderName).should(
      "have.text",
      `Members in ${workspaceName}`,
    );
  });

  it("6. Verify user with EditWorkspaceRole is able to edit general settings", function() {
    const fixturePath = "appsmithlogo.png";
    cy.xpath(homePage.uploadLogo).attachFile(fixturePath);
    cy.wait("@updateLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(homePage.removeLogo)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.wait("@deleteLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceWebsiteInput).clear();
    cy.get(homePage.workspaceWebsiteInput).type("demowebsite.com");
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePage.workspaceWebsiteInput).should(
      "have.value",
      "demowebsite.com",
    );
  });

  it("7. Verify user with DeleteWorkspaceRole is able to delete workspace ", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME3"),
      Cypress.env("TESTPASSWORD3"),
    );
    cy.wait(2000);
    cy.visit("/applications");
    cy.leaveWorkspace(workspaceName);
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.contains("Delete Workspace").click();
    cy.contains("Are you sure").click();
    cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
      expect(httpResponse.status).to.equal(200);
    });
    cy.get(workspaceName).should("not.exist");
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(ViewAuditlogsRole);
    cy.DeleteRole(CreateWorkspaceRole);
    cy.DeleteRole(EditWorkspaceRole);
    cy.DeleteRole(DeleteWorkspaceRole);
  });
});
