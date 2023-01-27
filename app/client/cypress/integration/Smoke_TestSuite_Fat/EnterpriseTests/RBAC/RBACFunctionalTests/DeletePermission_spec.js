import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer;
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
import homePage from "../../../../../locators/HomePage";
const datasources = require("../../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");

describe("Delete Permission flow ", function() {
  let appName;
  let workspaceName;
  let newWorkspaceName;
  let appName2;
  let datasourceName;
  let testUser3;
  const password = "qwerty";
  const page2 = "page2";
  const PermissionWorkspaceLevel =
    "DeletePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "DeletePermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "DeletePermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    // sign up as new user
    cy.generateUUID().then((uid) => {
      testUser3 = `${uid}@appsmith.com`;
      cy.AddIntercepts();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      // create a CRUD app
      cy.NavigateToHome();
      cy.generateUUID().then((uid) => {
        workspaceName = uid;
        appName = uid + "del";
        localStorage.setItem("WorkspaceName", workspaceName);
        cy.createWorkspace();
        cy.wait("@createWorkspace").then((interception) => {
          newWorkspaceName = interception.response.body.data.name;
          cy.renameWorkspace(newWorkspaceName, workspaceName);
        });
        cy.CreateAppForWorkspace(workspaceName, appName);

        // create new datasource
        cy.NavigateToDatasourceEditor();
        cy.get(datasources.PostgreSQL).click();
        cy.fillPostgresDatasourceForm();

        cy.generateUUID().then((uid) => {
          datasourceName = `Postgres CRUD ds ${uid}`;
          cy.renameDatasource(datasourceName);

          cy.testSaveDatasource();

          cy.NavigateToDSGeneratePage(datasourceName);
          cy.get(generatePage.selectTableDropdown).click();
          cy.get(generatePage.dropdownOption)
            .contains("public.users")
            .scrollIntoView()
            .should("be.visible")
            .click();
          // generate crud page
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

          cy.createJSObject('return "Success";');
          cy.createJSObject('return "Yo";');
          // create new page and add JSObject
          cy.CheckAndUnfoldEntityItem("Pages");
          cy.Createpage("page2");
          cy.wait(2000);
          cy.visit("settings/general");
          cy.DeletePermissionWorkspaceLevel(
            PermissionWorkspaceLevel,
            workspaceName,
          );
          cy.get(RBAC.roleRow)
            .first()
            .click();
          cy.wait("@fetchRoles").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
          // check the delete datasource role
          cy.get(RBAC.dataSourcesandQueriesTab).click();
          cy.contains("td", `${workspaceName}`)
            .next()
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
          cy.DeletePermissionAppLevel(
            PermissionAppLevel,
            workspaceName,
            appName,
          );
          cy.wait(2000);
          cy.DeletePermissionPageLevel(
            PermissionPageLevel,
            workspaceName,
            appName,
            "Public.users",
          );
          cy.wait(200);
          cy.AssignRoleToUser(
            PermissionWorkspaceLevel,
            Cypress.env("TESTUSERNAME1"),
          );
          cy.AssignRoleToUser(PermissionAppLevel, Cypress.env("TESTUSERNAME2"));
          cy.AssignRoleToUser(PermissionPageLevel, testUser3);
          // create another app in same workspace
          cy.NavigateToHome();
          cy.generateUUID().then((uid) => {
            appName2 = uid;
            cy.CreateAppForWorkspace(workspaceName, appName2);
            cy.wait(3000);
          });
        });
      });
    });
    cy.LogOut();
  });

  it("1. Delete permission : App level (Delete any page in same app, delete action)", function() {
    // login as exisiting user and verify user is able to delete page in same app
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
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
    cy.get(`.t--entity-name:contains("Public.users")`).click();
    cy.wait(4000);
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    // verify deletion of query
    ee.ActionContextMenuByEntityName("DeleteQuery", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("SelectQuery", "Delete", "Are you sure?");
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Deletepage("page2");
    // verify page is deleted
    cy.get(`.t--entity-name:contains(${page2})`).should("not.exist");
  });

  it("2. Delete permission : App level; verify user don't have create permissions", function() {
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
    cy.LogOut();
  });

  it("3. Delete permission : Page level (Delete query in same page)", function() {
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.wait(2000);
    // verify deletion of jsObject
    cy.get(homePage.searchInput).type(appName);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("Public.users")`).click();
    cy.wait(4000);
    // verify query deletion
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    ee.ActionContextMenuByEntityName("UpdateQuery", "Delete", "Are you sure?");
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(RBAC.JsObject1).should("not.exist");
  });

  it("4. Delete permission : Page level, verify user do not have create and edit permissions", function() {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePage.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput).type(appName);
    // verify create new app button is not visible to user
    cy.get(homePage.createNewAppButton).should("not.exist");
    cy.LogOut();
  });

  it("5. Delete permission : Workspace level and delete datasource permission", function() {
    // verify user can delete the datasource
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
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
    cy.get(`.t--entity-name:contains("Public.users")`).click();
    cy.wait(4000);
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    ee.ActionContextMenuByEntityName("InsertQuery", "Delete", "Are you sure?");
    cy.CheckAndUnfoldEntityItem("Datasources");
    cy.get(`.t--entity-name:contains(${datasourceName})`).trigger("mouseover");
    ee.SelectEntityByName(datasourceName, "Datasources");
    ee.ActionContextMenuByEntityName(datasourceName, "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
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
  });

  it("6. Delete permission : Workspace level, verify user is able to delete app", function() {
    // verify user is able to delete app in same workspace
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePage.searchInput)
      .clear()
      .type(appName2);
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
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.visit("/settings/roles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(PermissionAppLevel);
    cy.DeleteRole(PermissionPageLevel);
    cy.DeleteUser(testUser3);
  });
});
