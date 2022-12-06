import homePage from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const locators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper,
  homePage1 = ObjectsRegistry.HomePage;

describe("Create Permission flow ", function() {
  const datasourceName = "users";
  let workspaceName;
  let appName;
  let newWorkspaceName;
  const pageName = "testPage";
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "CreatePermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "CreatePermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;
  const ExportPermission =
    "ExportPermission" + `${Math.floor(Math.random() * 1000)}`;
  //const DeletePermission = "DeletePermissionAppLevel";
  beforeEach(() => {
    cy.AddIntercepts();
  });
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

      cy.get(generatePage.generateCRUDPageActionCard).click();

      cy.get(generatePage.selectDatasourceDropdown).click();

      cy.contains("Connect New Datasource").click();

      cy.createMockDatasource("users");
      cy.get(generatePage.selectTableDropdown).click();

      cy.get(generatePage.dropdownOption)
        .contains("public.users")
        .click();
      cy.get(generatePage.generatePageFormSubmitBtn).click();

      cy.wait("@replaceLayoutWithCRUDPage").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      cy.wait("@getActions");
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.ClickGotIt();
      cy.visit("settings/general");
      cy.CreatePermissionWorkspaceLevel(
        PermissionWorkspaceLevel,
        workspaceName,
      );
      // Add create datasource at workspace level role
      cy.get(RBAC.roleRow)
        .first()
        .click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // check the create datasource role
      cy.get(RBAC.dataSourcesandQueriesTab).click();
      cy.contains("td", `${workspaceName}`)
        .next()
        .next()
        .click();
      // save role
      cy.get(RBAC.saveButton).click();
      cy.wait("@saveRole").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(2000);
      // create custom roles
      cy.CreatePermissionAppLevel(PermissionAppLevel, workspaceName, appName);
      // Add create datasource at workspace level role
      cy.get(RBAC.roleRow)
        .first()
        .click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get(RBAC.dataSourcesandQueriesTab).click();
      // check the create datasource role
      cy.contains("td", `${workspaceName}`).click();
      cy.contains("td", `${workspaceName}`)
        .next()
        .next()
        .next()
        .next()
        .next();
      cy.contains("td", "Datasources").click();
      cy.contains("td", "users")
        .next()
        .next()
        .click();
      // save role
      cy.get(RBAC.saveButton).click();
      cy.wait("@saveRole").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.wait(2000);
      cy.CreatePermissionPageLevel(
        PermissionPageLevel,
        workspaceName,
        appName,
        "Page1",
      );
      cy.ExportPermissionWorkspaceLevel(ExportPermission, workspaceName);
      cy.wait(200);
      cy.AssignRoleToUser(
        PermissionWorkspaceLevel,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.AssignRoleToUser(PermissionAppLevel, Cypress.env("TESTUSERNAME2"));
      cy.AssignRoleToUser(ExportPermission, Cypress.env("TESTUSERNAME1"));
      cy.AssignRoleToUser(PermissionPageLevel, Cypress.env("TESTUSERNAME3"));
    });
  });

  it("1. Create permission - application resources , datasource & queries : Workspace level", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    // verify user is able to create app in same workspace
    cy.get(homePage.appsContainer).contains(workspaceName);
    cy.get(homePage.createNewAppButton)
      .first()
      .click();
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(4000);
    cy.get(homePage.homeIcon).click({ force: true });
    // verify user is able to create pages in exisiting app
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page3");
    cy.wait(1000);
    // create a clone of page
    cy.get(RBAC.newPage).within(() => {
      cy.get(locators.entityContextMenu).click({ force: true });
    });
    cy.selectAction("Clone");
    cy.wait("@clonePage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    // verify user is able to perform page level action
    cy.createJSObject('return "Success";');
    cy.wait(2000);
    // verify user is  able to create new datasource
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MySQL).click();
    cy.fillMySQLDatasourceForm();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
    cy.testSaveDatasource();
    // verify user is able to create new query
    cy.NavigateToActiveTab();
    cy.get(datasource.datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(datasource.datasourceCard)
      .within(() => {
        cy.get(queryLocators.createQuery).click();
      });
  });
  it("2.Create Permission : Workspace level, verify user has edit permission too", function() {
    // verify user should be able to edit existing app
    cy.reload(); //temp fix
    cy.get(homePage.homeIcon).click({ force: true });
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page2");
    cy.wait(1000);
    // verify user should be able to edit the page
    cy.get(RBAC.newPage)
      .first()
      .click();
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
    cy.get(".t--widget-tablewidgetv2").should("exist");
    cy.get(homePage.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    // verify duplication of app
    homePage1.DuplicateApplication(appName);
    agHelper.WaitUntilAllToastsDisappear();
  });

  it("3. Export permission- Verify user is able to export app", function() {
    // verify user is able to export the app
    cy.NavigateToHome();
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.exportAppFromMenu).should("be.visible");
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.toastMessage).should("contain", "Successfully exported");
  });

  it("4. Create permission- application resources & datasource and queries: App level", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    // verify user is able to create new page in same app
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page2");
    cy.wait(1000);
    // verify user is able to perform page level action
    cy.createJSObject('return "Success";');
    cy.wait(2000);
    // verify user is not able to create new datasource
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    // verify user is able to create new query
    cy.get(explorer.createNew).click({ force: true });
    // create new query
    cy.get(".t--file-operation")
      .last()
      .click({ force: true });
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.WaitAutoSave();
  });

  it("5. Create permission : Page level Create new query/jsObject in same page) ", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME3"),
      Cypress.env("TESTPASSWORD3"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    // verify user is not able to create new page
    cy.get(explorer.AddPage).should("not.exist");
    // verify user is able to perform page level action
    // cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    /*cy.NavigateToAPI_Panel();
    cy.CreateAPI("FirstAPI");
    cy.RunAPI(); */
  });

  it("6. Delete permission : App level", function() {
    // verify user is able to delete application
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.get(homePage.searchInput).type(appName);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.wait(2000);
    cy.get(homePage.appMoreIcon)
      .should("have.length", 1)
      .first()
      .click({ force: true });
    cy.wait(2000);
    cy.get(homePage.deleteAppConfirm)
      .should("be.visible")
      .click({ force: true });
    cy.get(homePage.deleteApp)
      .should("be.visible")
      .click({ force: true });
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should("have.property", "status", 200);
  });
  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(PermissionAppLevel);
    cy.DeleteRole(PermissionPageLevel);
    cy.DeleteRole(ExportPermission);
  });
});
