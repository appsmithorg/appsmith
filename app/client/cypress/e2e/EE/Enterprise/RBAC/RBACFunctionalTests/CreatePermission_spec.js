import homePageLocators from "../../../../../locators/HomePage";
import reconnectDatasourceModal from "../../../../../locators/ReconnectLocators";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasources = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const explorer = require("../../../../../locators/explorerlocators.json");
import datasourceFormData from "../../../../../fixtures/datasources.json";
const omnibar = require("../../../../../locators/Omnibar.json");
import reconnectDatasourceModal from "../../../../../locators/ReconnectLocators";

import {
  agHelper,
  dataSources,
  entityExplorer,
  homePage,
} from "../../../../../support/Objects/ObjectsCore";

describe("Create Permission flow ", function () {
  let datasourceName;
  let datasourceName2;
  let workspaceName;
  let appName;
  let newWorkspaceName;
  let APIName;
  let testUser3;
  const password = "qwerty";
  const PermissionWorkspaceLevel =
    "CreatePermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionAppLevel =
    "CreatePermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
  const PermissionPageLevel =
    "CreatePermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;
  const ExportPermission =
    "ExportPermission" + `${Math.floor(Math.random() * 1000)}`;
  const apiName = "Omnibar1";
  const jsObjectName = "Omnibar2";
  //const DeletePermission = "DeletePermissionAppLevel";
  beforeEach(() => {
    cy.AddIntercepts();
    cy.startRoutesForDatasource();
  });
  before(() => {
    // sign up as new user
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
          agHelper.VisitNAssert("/settings/general", "getEnvVariables");
          cy.CreatePermissionWorkspaceLevel(
            PermissionWorkspaceLevel,
            workspaceName,
          );
          // Add create datasource at workspace level role
          cy.get(RBAC.roleRow).first().click();
          cy.wait("@fetchRoles").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
          // check the create datasource role
          cy.get(RBAC.dataSourcesandQueriesTab).click();
          cy.contains("td", `${workspaceName}`).next().next().click();
          // save role
          cy.get(RBAC.saveButton).click();
          cy.wait("@saveRole").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            200,
          );
          cy.wait(2000);
          // create custom roles
          cy.CreatePermissionAppLevel(
            PermissionAppLevel,
            workspaceName,
            appName,
          );
          // Add create datasource at workspace level role
          cy.get(RBAC.roleRow).first().click();
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
          cy.contains("td", `${datasourceName}`).next().next().click();
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
          cy.AssignRoleToUser(PermissionPageLevel, testUser3);
          cy.LogOut();
        });
      });
    });
  });

  it("1. Create permission - application resources , datasource & queries : Workspace level", function () {
    homePage.LogintoApp(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).type(appName);
    cy.wait(2000);
    // verify user is able to create app in same workspace
    cy.get(homePageLocators.appsContainer).contains(workspaceName);
    cy.get(homePageLocators.createNewAppButton).first().click();
    cy.wait("@applications").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(4000);
    homePage.NavigateToHome();
    // verify user is able to create pages in exisiting app
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    //entityExplorer.ExpandCollapseEntity("Pages");
    //cy.CheckAndUnfoldEntityItem("Pages");
    //cy.Createpage("page3");
    entityExplorer.AddNewPage("New blank page").then(($newPage) => {
      entityExplorer.RenameEntityFromExplorer($newPage, "page3", true);
      entityExplorer.ClonePage("page3");
    });

    // Wait till the cloned page is the active page
    cy.get(`.t--entity.page`)
      .contains("page3 Copy")
      .closest(".t--entity")
      .should("be.visible")
      .should("have.class", "activePage");

    // verify user is able to perform page level action
    cy.createJSObject('return "Success";');
    cy.wait(2000);
    // verify user is  able to create new datasource
    dataSources.CreateDataSource("MySql");
    cy.generateUUID().then((UUID) => {
      datasourceName2 = `MySQL MockDS ${UUID}`;
      cy.renameDatasource(datasourceName2);
      // verify user is able to create new query & verify create new datasource dropdown cta is visible
      cy.NavigateToActiveDSQueryPane(datasourceName2);
      cy.get(".rc-select-selector").click();
      cy.get(".rc-select-item-option-content")
        .last()
        .contains("Create new datasource");
      cy.get(queryLocators.templateMenu).click();
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("select * from users limit 10");
      agHelper.AssertAutoSave();
      dataSources.RunQuery({
        toValidateResponse: false,
      });
    });
  });

  it("2. Create Permission : Workspace level, verify user has edit permission too", function () {
    // verify user should be able to edit existing app
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.Createpage("page2");
    cy.wait(1000);
    // verify user should be able to edit the page
    cy.get(RBAC.newPage).first().click();
    cy.wait(2000);
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
    cy.get(".t--widget-tablewidgetv2").should("exist");
    cy.get(homePageLocators.homeIcon).click({ force: true });
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    // verify duplication of app
    homePage.ForkApplication(appName);
  });

  it("3. Create Permission : Workspace level, verify user can import an application", function () {
    // verify user should be able to import an app
    // import application
    cy.get(homePageLocators.homeIcon).click();
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.get(homePageLocators.optionsIcon).first().click();
    cy.get(homePageLocators.workspaceImportAppOption).click({ force: true });
    cy.get(homePageLocators.workspaceImportAppModal).should("be.visible");
    cy.xpath(homePageLocators.uploadLogo).attachFile("forkedApp.json");
    cy.get(homePageLocators.importAppProgressWrapper).should("be.visible");
    cy.wait("@importNewApplication").then((interception) => {
      cy.wait(100);
      // should check reconnect modal opening
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect button
        cy.get(reconnectDatasourceModal.Modal).should("be.visible");
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({ force: true });
        cy.wait(2000);
      } else {
        cy.get(homePageLocators.toastMessage).should(
          "contain",
          "Application imported successfully",
        );
      }
    });
  });

  it("4. Export permission- Verify user is able to export app", function () {
    // verify user is able to export the app
    homePage.NavigateToHome();
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(RBAC.appMoreIcon).first().click({ force: true });
    cy.get(homePageLocators.exportAppFromMenu).should("be.visible");
    cy.get(homePageLocators.exportAppFromMenu).click({ force: true });
    cy.get(homePageLocators.toastMessage).should(
      "contain",
      "Successfully exported",
    );
    cy.LogOut();
  });

  it("5. Create permission- application resources & datasource and queries: App level", function () {
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).type(appName);
    cy.wait(2000);
    // verify create new app button is not visible to user
    cy.get(homePageLocators.createNewAppButton).should("not.exist");
    // verify user is able to create new page in same app
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
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
    cy.get("[data-testid='t--file-operation']").eq(1).click({ force: true });
    cy.get(queryLocators.queryNameField).type("get_columns");
    cy.get(queryLocators.templateMenu).click();
    cy.WaitAutoSave();
    cy.LogOut();
  });

  it("6. Create permission : Page level Create new query/jsObject in same page) ", function () {
    cy.SignupFromAPI(testUser3, password);
    cy.LogintoAppTestUser(testUser3, password);
    cy.wait(2000);
    cy.get(homePageLocators.searchInput).clear().type(appName);
    // verify create new app button is not visible to user
    cy.get(homePageLocators.createNewAppButton).should("not.exist");
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    // verify user is not able to create new page
    cy.get(explorer.AddPage).should("not.exist");
    cy.get(explorer.createNew).click({ force: true });
    // verify user is able to create new api
    cy.get("[data-testid='t--file-operation']").first().click({ force: true });
    cy.generateUUID().then((uid) => {
      APIName = uid;
      cy.CreateAPI(APIName);
    });
    cy.enterDatasource(datasourceFormData.mockApiUrl);
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("200");
  });

  it("7. Omnibar : Action creation", function () {
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME1"),
      Cypress.env("TESTPASSWORD1"),
    );
    cy.get(homePageLocators.searchInput).clear().type(appName);
    cy.wait(2000);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.get(homePageLocators.appEditIcon).click();
    cy.wait(2000);
    cy.CheckAndUnfoldEntityItem("Pages");
    // verify create new on omnibar is visible to user
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle)
      .eq(1)
      .should("have.text", "Create new")
      .next()
      .should("have.text", "Create a new query, API or JS Object");
    cy.get(omnibar.categoryTitle).eq(1).click();
    cy.intercept("POST", "/api/v1/actions").as("createNewApi");
    cy.intercept("POST", "/api/v1/collections/actions").as(
      "createNewJSCollection",
    );

    // Assert can create JS action from omnibar
    cy.get(omnibar.createNew).contains("New JS Object").click().wait(1000);
    cy.wait("@createNewJSCollection");
    cy.wait(1000);
    cy.get(".t--js-action-name-edit-field").type(jsObjectName).wait(1000);

    // Assert can create APi action from omnibar
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle).eq(1).click();
    cy.get(omnibar.createNew).contains("New blank API").click();
    cy.wait(1000);
    cy.wait("@createNewApi").then((response) => {
      apiName = response.response.body.data.name;
      entityExplorer.SelectEntityByName(apiName, "Queries/JS");
    });
    agHelper.RenameWithInPane(apiName);

    // Assert last item is for create datasource
    cy.get(omnibar.globalSearch).click({ force: true });
    cy.get(omnibar.categoryTitle).eq(1).click();
    cy.get(omnibar.createNew).last().should("have.text", "New datasource");
  });

  it("8. Delete App for user which has create access", function () {
    // verify user is able to delete application
    cy.LogOut();
    cy.LogintoAppTestUser(
      Cypress.env("TESTUSERNAME2"),
      Cypress.env("TESTPASSWORD2"),
    );
    cy.get(homePageLocators.searchInput).type(appName);
    cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
    cy.wait(2000);
    cy.get(RBAC.appMoreIcon)
      // .should("have.length", 1)
      .first()
      .click({ force: true });
    cy.wait(2000);
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
  });

  after(() => {
    cy.LogOut();
    cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    agHelper.VisitNAssert("settings/roles", "fetchRoles");
    cy.DeleteRole(PermissionWorkspaceLevel);
    cy.DeleteRole(PermissionAppLevel);
    cy.DeleteRole(PermissionPageLevel);
    cy.DeleteRole(ExportPermission);
    cy.DeleteUser(testUser3);
  });
});
