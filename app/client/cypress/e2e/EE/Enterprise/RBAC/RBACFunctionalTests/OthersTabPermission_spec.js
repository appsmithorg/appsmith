import homePageLocators from "../../../../../locators/HomePage";
import locators from "../../../../../locators/AuditLogsLocators";
const RBAC = require("../../../../../locators/RBAClocators.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { homePage, agHelper } from "../../../../../support/Objects/ObjectsCore";

describe("Others tab permission Tests", function () {
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
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      cy.ViewAuditLogsRole(ViewAuditlogsRole);
      cy.CreateWorkspaceRole(CreateWorkspaceRole);
      cy.EditWorkspaceRole(EditWorkspaceRole, workspaceName);
      cy.DeleteWorkspaceRole(DeleteWorkspaceRole, workspaceName);
      // add delete app permission
      cy.get(RBAC.roleRow).first().click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.contains("td", `${workspaceName}`).next().next().next().click();
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

  it("1. Verify user with ViewAuditlogsRole is able to view audit logs", function () {
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

  it("2. Verify user with ViewAuditlogsRole is able to view audit logs and verify logs", function () {
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

  it("3. Verify user with CreateWorkspaceRole is able to create new workspace ", function () {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      newWorkspaceName = interception.response.body.data.name;
    });
    cy.LogOut();
  });

  it("4. Verify user with EditWorkspaceRole is able to edit workspace ", function () {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.get(homePageLocators.workspaceNamePopoverContent)
      .find(".ads-v2-menu__menu-item")
      .should("have.length", 1);
    /* checking negative scenario for audit logs access */
    cy.get(locators.AdminSettingsEntryLink).should("not.exist");
  });

  it("5. Verify user with EditWorkspaceRole is able to edit workspace name ", function () {
    cy.wait(2000);
    cy.get(homePageLocators.workspaceList.concat(workspaceName).concat(")"))
      .scrollIntoView()
      .should("be.visible");
    cy.get(homePageLocators.workspaceList.concat(workspaceName).concat(")"))
      .closest(homePageLocators.workspaceCompleteSection)
      .scrollIntoView()
      .find(homePageLocators.optionsIcon)
      .click({ force: true });
    cy.get("[data-testid='t--workspace-setting']").click({ force: true });
    cy.get(RBAC.generalTab).click();
    cy.get(homePageLocators.workspaceNameInput).click({ force: true });
    cy.get(homePageLocators.workspaceNameInput).clear();
    cy.get(homePageLocators.workspaceNameInput).type(`${workspaceName} edited`);
    cy.wait(2000);
    cy.get(homePageLocators.workspaceHeaderName).should(
      "have.text",
      `${workspaceName} edited`,
    );
    cy.get(RBAC.generalTab).click();
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePageLocators.workspaceNameInput).click({ force: true });
    cy.get(homePageLocators.workspaceNameInput).clear();
    cy.get(homePageLocators.workspaceNameInput).type(workspaceName);
    cy.get(RBAC.generalTab).click();
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePageLocators.workspaceHeaderName).should(
      "have.text",
      `${workspaceName}`,
    );
  });

  it("6. Verify user with EditWorkspaceRole is able to edit general settings", function () {
    const fixturePath = "appsmithlogo.png";
    cy.xpath(homePageLocators.uploadLogo).attachFile(fixturePath);
    cy.wait("@updateLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(1000);
    cy.get(homePageLocators.removeLogo)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });
    cy.wait("@deleteLogo").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePageLocators.workspaceWebsiteInput).clear();
    cy.get(homePageLocators.workspaceWebsiteInput).type("demowebsite.com");
    cy.wait("@updateWorkspace").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(homePageLocators.workspaceWebsiteInput).should(
      "have.value",
      "demowebsite.com",
    );
    cy.LogOut();
  });

  it("7. Verify user with DeleteWorkspaceRole is able to delete workspace ", function () {
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.wait(2000);
    // delete app
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.wait(2000);
    cy.get(RBAC.appMoreIcon)
      .should("have.length", 1)
      .first()
      .click({ force: true });
    cy.get(homePageLocators.deleteAppConfirm)
      .should("be.visible")
      .click({ force: true });
    cy.get(homePageLocators.deleteApp)
      .should("be.visible")
      .click({ force: true });
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // delete workspace
    cy.openWorkspaceOptionsPopup(workspaceName);
    cy.contains("Delete workspace").click();
    cy.contains("Are you sure").click();
    cy.wait("@deleteWorkspaceApiCall").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(workspaceName).should("not.exist");
    cy.LogOut();
  });

  after(() => {
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.VisitNAssert("settings/roles", "fetchRoles");
    cy.DeleteRole(ViewAuditlogsRole);
    cy.DeleteRole(CreateWorkspaceRole);
    cy.DeleteRole(EditWorkspaceRole);
    cy.DeleteRole(DeleteWorkspaceRole);
    cy.DeleteUser(testUser3);
  });
});
