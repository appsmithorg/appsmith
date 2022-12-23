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
  let testUser3;
  const password = "qwerty";
  const ViewAuditlogsRole =
    "viewAuditLogs" + `${Math.floor(Math.random() * 1000)}`;
  const CreateWorkspaceRole =
    "createRole" + `${Math.floor(Math.random() * 1000)}`;
  const EditWorkspaceRole = "editRole" + `${Math.floor(Math.random() * 1000)}`;
  const DeleteWorkspaceRole =
    "deleteRole" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
    cy.startRoutesForDatasource();
  });

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
      // add delete app permission
      cy.get(RBAC.roleRow)
        .first()
        .click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.contains("td", `${workspaceName}`)
        .next()
        .next()
        .next()
        .click();
      cy.get(RBAC.saveButton).click();
      // save api call
      cy.wait(2000);
      cy.wait("@saveRole").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(RBAC.backButton).click();
      cy.AssignRoleToUser(ViewAuditlogsRole, Cypress.env("TESTUSERNAME1"));
      cy.AssignRoleToUser(CreateWorkspaceRole, Cypress.env("TESTUSERNAME1"));
      cy.AssignRoleToUser(EditWorkspaceRole, Cypress.env("TESTUSERNAME2"));
      // sign up as new user
      cy.generateUUID().then((uid) => {
        testUser3 = `${uid}@appsmith.com`;
        cy.AssignRoleToUser(DeleteWorkspaceRole, testUser3);
      });
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
    cy.LogOut();
  });

  it("4. Verify user with EditWorkspaceRole is able to edit workspace ", function() {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.visit("/applications");
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.get(homePage.workspaceNamePopoverContent)
      .find("a")
      .should("have.length", 1);
    /* checking negative scenario for audit logs access */
    cy.get(locators.AdminSettingsEntryLink).should("not.exist");
  });

  it("5. Verify user with EditWorkspaceRole is able to edit workspace name ", function() {
    cy.visit("/applications");
    cy.wait(2000);
    cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
      .scrollIntoView()
      .should("be.visible");
    cy.get(homePage.workspaceList.concat(workspaceName).concat(")"))
      .closest(homePage.workspaceCompleteSection)
      .find(homePage.workspaceNamePopover)
      .find(homePage.optionsIcon)
      .click({ force: true });
    cy.get("[data-cy='t--workspace-setting']").click({ force: true });
    cy.get(RBAC.generalTab).click();
    cy.get(homePage.workspaceNameInput).click({ force: true });
    cy.get(homePage.workspaceNameInput).clear();
    cy.get(homePage.workspaceNameInput).type(`${workspaceName} edited`);
    cy.wait(2000);
    cy.get(homePage.workspaceHeaderName).should(
      "have.text",
      `${workspaceName} edited`,
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
      `${workspaceName}`,
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
    cy.LogOut();
  });

  it("7. Verify user with DeleteWorkspaceRole is able to delete workspace ", function() {
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.wait(2000);
    cy.visit("/applications");
    // delete app
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.wait(2000);
    cy.get(homePage.appMoreIcon)
      .should("have.length", 1)
      .first()
      .click({ force: true });
    cy.get(homePage.deleteAppConfirm)
      .should("be.visible")
      .click({ force: true });
    cy.get(homePage.deleteApp)
      .should("be.visible")
      .click({ force: true });
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should("have.property", "status", 200);
    // delete workspace
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.contains("Delete Workspace").click();
    cy.contains("Are you sure").click();
    cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
      expect(httpResponse.status).to.equal(200);
    });
    cy.get(workspaceName).should("not.exist");
    cy.LogOut();
  });

  after(() => {
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(ViewAuditlogsRole);
    cy.DeleteRole(CreateWorkspaceRole);
    cy.DeleteRole(EditWorkspaceRole);
    cy.DeleteRole(DeleteWorkspaceRole);
    cy.DeleteUser(testUser3);
  });
});
