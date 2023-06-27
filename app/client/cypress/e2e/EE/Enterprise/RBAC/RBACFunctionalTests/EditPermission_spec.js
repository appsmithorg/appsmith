import homePageLocators from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const datasourceFormData = require("../../../../../fixtures/datasources.json");
const datasourceEditor = require("../../../../../locators/DatasourcesEditor.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const jsEditorLocators = require("../../../../../locators/JSEditor.json");
const omnibar = require("../../../../../locators/Omnibar.json");
import {
  jsEditor,
  homePage,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";

describe("Edit Permission flow ", function () {
  let newWorkspaceName;
  let workspaceName;
  let appName;
  let datasourceName2;
  let datasourceName;
  let testUser3;
  const password = "qwerty";
  const appName2 = "testApp" + `${Math.floor(Math.random() * 1000)}`;
  const pageName = "testPage";
  const PermissionWorkspaceLevel =
    "EditPermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "EditPermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "EditPermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;

  beforeEach(() => {
    cy.AddIntercepts();
  });

  before(() => {
    cy.generateUUID().then((uid) => {
      testUser3 = `${uid}@appsmith.com`;
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      cy.AddIntercepts();
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
        // create new datasource
        cy.NavigateToDatasourceEditor();
        cy.get(datasourceEditor.PostgreSQL).click();
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
          // create new datasource
          cy.NavigateToDatasourceEditor();
          cy.get(datasource.MySQL).click();
          cy.fillMySQLDatasourceForm();
          cy.generateUUID().then((UUID) => {
            datasourceName2 = `MySQL MOCKDS ${UUID}`;
            cy.renameDatasource(datasourceName2);
          });
          cy.testSaveDatasource();
          jsEditor.CreateJSObject(
            `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
          return "Success";//write code here
        },
        myFun2: async () => {
          //use async-await or promises
        }
      }`,
            {
              paste: true,
              completeReplace: true,
              toRun: true,
              shouldCreateNewJSObj: true,
            },
          );
          homePage.NavigateToHome();
          cy.CreateAppForWorkspace(workspaceName, appName2);
          jsEditor.CreateJSObject(
            `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
          return "Success";//write code here
        },
        myFun2: async () => {
          //use async-await or promises
        }
      }`,
            {
              paste: true,
              completeReplace: true,
              toRun: true,
              shouldCreateNewJSObj: true,
            },
          );
          cy.visit("settings/general");
          cy.EditPermissionWorkspaceLevel(
            PermissionWorkspaceLevel,
            workspaceName,
          );
          // Add edit datasource at workspace level role
          cy.get(RBAC.roleRow).first().click();
          cy.wait("@fetchRoles").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
          // check the edit datasource role
          cy.get(RBAC.dataSourcesandQueriesTab).click();
          cy.contains("td", `${workspaceName}`).next().next().next().click();
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
          cy.AssignRoleToUser(PermissionPageLevel, testUser3);
          cy.LogOut();
        });
      });
    });
  });
  it("1. Edit permission : Workspace level (Edit existing app in same workspace) and verify edit access is provided for datasources", function () {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.intercept("PUT", "/api/v1/datasources/*").as("saveEditedDatasouce");
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName2);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    // verify user is able to edit all apps in the workspace
    let appnameEdited = "test";
    cy.AppSetupForRename();
    cy.get(homePageLocators.applicationName).type(appnameEdited + "{enter}");
    // verify user is able to edit pages in exisiting app
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("Public.users")`).click();
    cy.wait(4000);
    // verify user is able edit widget name
    cy.openPropertyPane("tablewidget");
    cy.widgetText(
      "data_table_edited",
      widgetsPage.tableWidget,
      commonlocators.tableInner,
    );
    cy.wait(2000);
    // verify user is  able to edit datasource and queries
    cy.CheckAndUnfoldEntityItem("Datasources");
    cy.get(`.t--entity-item:contains(${datasourceName2})`).click();
    cy.get(datasource.createQuery).should("be.disabled");
    cy.get(datasource.editDatasource).click();
    cy.get(datasourceEditor.port)
      .clear()
      .type(datasourceFormData["mysql-port"]);
    dataSources.ExpandSectionByName("Authentication");
    cy.get(datasourceEditor.password).type(
      datasourceFormData["mysql-password"],
    );
    cy.testDatasource();
    cy.get(".t--save-datasource").click({ force: true });
    cy.wait("@saveEditedDatasouce").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // verify create new on omnibar is visible to user
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle).eq(1).should("not.have.text", "Create new");
    cy.get("body").click(0, 0, { force: true });
  });

  it("2. Edit permission : Workspace level, Verify user is not able to create or delete resources", function () {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    // verify create new app button is not visible to user
    cy.get(homePageLocators.createNewAppButton).should("not.exist");
    cy.wait(2000);
  });

  it("3. Edit permission : App level (Edit exisiting pages in same app) and verify edit access is provided for app's datasources", function () {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).type(appName);
    cy.wait(2000);
    // verify user is able to edit pages in exisiting app
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    // verify user is able edit page name
    // rename page to crud_page
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.renameEntity("Page1", pageName);
    cy.get(`.t--entity-name:contains(${pageName})`)
      .trigger("mouseover")
      .click({ force: true });
    cy.get(`.t--entity-item:contains(${pageName})`).first().click();
    cy.wait("@getPage");
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("Public.users")`).click();
    cy.wait(4000);
    cy.openPropertyPane("tablewidget");
    cy.widgetText(
      "data_table_edited2",
      widgetsPage.tableWidget,
      commonlocators.tableInner,
    );
    cy.wait(2000);
    // verify user is able to edit JSObject
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(RBAC.JsObject1).click();
    cy.wait(1000);
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{downarrow}{downarrow}{downarrow}  ")
      .type("testJSFunction:()=>{},");
    cy.wait(1000);
    cy.get(jsEditorLocators.runButton).first().click({ force: true });
    cy.wait(3000);
    // verify user is not able to edit datasource but edit queries
    cy.CheckAndUnfoldEntityItem("Datasources");
    cy.get(`.t--entity-item:contains(${datasourceName})`).should("not.exist");
    // datasoruce is not visible
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get(".t--entity-name").contains("SelectQuery").click();
    cy.wait(1000);
    cy.get(".rc-select-selector").click({ force: true });
    //verify it doesn't contain create new datasource option from dropdown
    cy.get(".rc-select-item-empty").should("contain", "Not Found");
    cy.wait(5000);
    cy.get(".t--action-name-edit-icon").type("SelectQueryEdited{enter}");
    cy.wait("@getPage");
  });

  it("4. Edit permission : App level, Verify user is not able to create or delete resources", function () {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    // verify create new app button is not visible to user
    cy.get(homePageLocators.createNewAppButton).should("not.exist");
    cy.LogOut();
  });

  it("5. Edit permission : Page level (Edit jsObject in same page) ", function () {
    //login as that user and verify that user can edit query/jsObject
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
  });

  it("6. Edit permission : Page level, Verify user is not able to create or delete resources", function () {
    // verify create button does not exist
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.addDBQueryEntity).should("not.exist");
    cy.get(explorer.addEntityJSEditor).should("not.exist");
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    // verify create new app button is not visible to user
    cy.get(homePageLocators.createNewAppButton).should("not.exist");
    cy.wait(2000);
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
