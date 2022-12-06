import homePage from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const datasourceFormData = require("../../../../../fixtures/datasources.json");
const datasourceEditor = require("../../../../../locators/DatasourcesEditor.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const jsEditorLocators = require("../../../../../locators/JSEditor.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

describe("Edit Permission flow ", function() {
  let newWorkspaceName;
  let workspaceName;
  let appName;
  let datasourceName2;
  const appName2 = "testApp" + `${Math.floor(Math.random() * 1000)}`;
  const pageName = "testPage";
  const PermissionWorkspaceLevel =
    "EditPermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "EditPermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "EditPermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;
  const datasourceName = "users";

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
      // create new datasource
      /* cy.NavigateToDatasourceEditor();
      cy.get(datasource.PostgreSQL).click();
      cy.fillPostgresDatasourceForm();
      cy.get("@createDatasource").then((httpResponse) => {
        datasourceName2 = httpResponse.response.body.data.name;
      });
      cy.testSaveDatasource();
      */

      // commeting until datasource creation is fixed
      // https://github.com/appsmithorg/appsmith/issues/18591
      cy.createJSObject('return "Success";');
      cy.NavigateToHome();
      cy.CreateAppForWorkspace(workspaceName, appName2);
      cy.createJSObject('return "Success";');
      cy.visit("settings/general");
      cy.EditPermissionWorkspaceLevel(PermissionWorkspaceLevel, workspaceName);
      // Add edit datasource at workspace level role
      cy.get(RBAC.roleRow)
        .first()
        .click();
      cy.wait("@fetchRoles").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // check the edit datasource role
      cy.get(RBAC.dataSourcesandQueriesTab).click();
      cy.contains("td", `${workspaceName}`)
        .next()
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
      cy.wait(4000);
      // create custom roles
      cy.EditPermissionAppLevel(PermissionAppLevel, workspaceName, appName);

      cy.EditPermissionPageLevel(
        PermissionPageLevel,
        workspaceName,
        appName,
        "Page1",
      );
      cy.AssignRoleToUser(
        PermissionWorkspaceLevel,
        Cypress.env("TESTUSERNAME1"),
      );
      cy.AssignRoleToUser(PermissionAppLevel, Cypress.env("TESTUSERNAME2"));
      cy.AssignRoleToUser(PermissionPageLevel, Cypress.env("TESTUSERNAME3"));
      cy.LogOut();
    });
  });

  it("1. Edit permission : Workspace level (Edit existing app in same workspace) and verify edit access is provided for datasources", function() {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName2);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    // verify user is able to edit all apps in the workspace
    let appnameEdited = "test";
    cy.AppSetupForRename();
    cy.get(homePage.applicationName).type(appnameEdited + "{enter}");
    // verify user is able to edit pages in exisiting app
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    // verify user is able edit widget name
    cy.openPropertyPane("tablewidget");
    cy.widgetText(
      "data_table_edited",
      widgetsPage.tableWidget,
      commonlocators.tableInner,
    );
    cy.wait(2000);
    // verify user is  able to edit datasource and queries
    /*cy.CheckAndUnfoldEntityItem("Datasources");
    cy.get(`.t--entity-item:contains(${datasourceName2})`).click();
    cy.get(datasource.createQuery).should("be.disabled");
    cy.get(datasource.editDatasource).click();
    cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
    cy.testSaveDatasource();
    */ // commenting until datasource creation is fixed
  });

  it("2. Edit permission : Workspace level, Verify user is not able to create or delete resources", function() {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePage.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    cy.wait(2000);
  });

  it("3. Edit permission : App level (Edit exisiting pages in same app) and verify edit access is provided for app's datasources", function() {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    // verify user is able to edit pages in exisiting app
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    // verify user is able edit page name
    // rename page to crud_page
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.renameEntity("Page1", pageName);
    cy.get(`.t--entity-name:contains(${pageName})`)
      .trigger("mouseover")
      .click({ force: true });
    cy.get(`.t--entity-item:contains(${pageName})`)
      .first()
      .click();
    cy.wait("@getPage");
    cy.openPropertyPane("tablewidget");
    cy.widgetText(
      "data_table_edited2",
      widgetsPage.tableWidget,
      commonlocators.tableInner,
    );
    cy.wait(2000);
    // verify user is able to edit JSObject
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(RBAC.JSObject1).click();
    cy.wait(1000);
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{downarrow}{downarrow}{downarrow}{downarrow}  ")
      .type("JSCode");
    cy.wait(1000);
    cy.get(jsEditorLocators.runButton)
      .first()
      .click();
    // verify user is not able to edit datasource but edit queries
    cy.CheckAndUnfoldEntityItem("Datasources");
    cy.get(RBAC.usersDatasource).should("not.exist");
    // datasoruce is not visible
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(".t--entity-name")
      .contains("SelectQuery")
      .click();
    ee.ActionContextMenuByEntityName("SelectQueryEdited", "Edit Name");
  });

  it("4. Edit permission : App level, Verify user is not able to create or delete resources", function() {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePage.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    cy.wait(2000);
  });

  it("5. Edit permission : Page level (Edit jsObject in same page) ", function() {
    cy.LogOut();
    //login as that user and verify that user can edit query/jsObject
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME3"),
      Cypress.env("TESTPASSWORD3"),
    );
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
  });

  it("6. Edit permission : Page level, Verify user is not able to create or delete resources", function() {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePage.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    cy.wait(2000);
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(PermissionAppLevel);
    cy.DeleteRole(PermissionPageLevel);
  });
});
