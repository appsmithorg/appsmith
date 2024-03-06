import homePageLocators from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasources = require("../../../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../../../locators/apiWidgetslocator.json");
const jsEditorLocators = require("../../../../../locators/JSEditor.json");
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";

import {
  homePage,
  onboarding,
  dataManager,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Multiple Permission flow ",
  { tags: ["@tag.AccessControl"] },
  function () {
    let datasourceName;
    let datasourceName2;
    let workspaceName;
    let appName;
    let newWorkspaceName;
    let newWorkspaceName2;
    let appName2;
    let workspaceName2;
    const APIName = "testAPI";
    let CreatePermission =
      "CreatePermission" + `${Math.floor(Math.random() * 1000)}`;
    let EditPermission =
      "EditPermission" + `${Math.floor(Math.random() * 1000)}`;
    beforeEach(() => {
      cy.AddIntercepts();
      cy.startRoutesForDatasource();
    });
    before(() => {
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
        cy.get(datasources.MySQL).click();
        cy.fillMySQLDatasourceForm();
        cy.generateUUID().then((uid) => {
          datasourceName = `MySQL CRUD ds ${uid}`;
          cy.renameDatasource(datasourceName);
          cy.testSaveDatasource();
          cy.NavigateToDSGeneratePage(datasourceName);
          cy.get(generatePage.selectTableDropdown).click();
          cy.get(generatePage.dropdownOption)
            .contains("employees")
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
          homePage.NavigateToHome();
          cy.generateUUID().then((uid) => {
            workspaceName2 = uid;
            appName2 = uid + "gac";
            localStorage.setItem("WorkspaceName2", workspaceName2);
            cy.createWorkspace();
            cy.wait("@createWorkspace").then((interception) => {
              newWorkspaceName2 = interception.response.body.data.name;
              homePage.RenameWorkspace(newWorkspaceName2, workspaceName2);
            });
            cy.CreateAppForWorkspace(workspaceName2, appName2);
            cy.NavigateToAPI_Panel();
            cy.CreateAPI(APIName);
            cy.enterDatasource(
              dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
            );
            cy.SaveAndRunAPI();
            cy.ResponseStatusCheck("200");
            cy.createJSObject('return "Success";');
            cy.visit("settings/general");
            featureFlagIntercept({
              license_gac_enabled: true,
            });
            cy.wait(2000);
            cy.CreatePermissionWorkspaceLevel(CreatePermission, workspaceName);
            // Add create datasource at workspace level role
            cy.get(RBAC.roleRow).first().click();
            cy.wait("@fetchRoles").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            // check the create datasource role
            cy.get(RBAC.dataSourcesandQueriesTab).click();
            cy.contains("td", `${workspaceName}`).click();
            cy.contains("td", "Datasources").next().next().click();
            cy.contains("td", "Environments").next().click();
            // save role
            cy.get(RBAC.saveButton).click();
            cy.wait("@saveRole").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            cy.EditPermissionWorkspaceLevel(EditPermission, workspaceName2);
            cy.wait(2000);
            cy.AssignRoleToUser(CreatePermission, Cypress.env("TESTUSERNAME1"));
            cy.AssignRoleToUser(EditPermission, Cypress.env("TESTUSERNAME1"));
            // give appsmith provided role to testuser
            let AppsmithProvidedRole = "App Viewer - " + `${workspaceName2}`;
            cy.AssignRoleToUser(
              AppsmithProvidedRole,
              Cypress.env("TESTUSERNAME2"),
            );
            cy.AssignRoleToUser(EditPermission, Cypress.env("TESTUSERNAME2"));
          });
        });
      });
    });

    it("1. Verify user with edit permission is able to fork application in workspace for which they have create permission ", function () {
      cy.LogOut();
      cy.LogintoAppTestUser(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).type(appName2);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(RBAC.appMoreIcon).first().click({ force: true });
      cy.get(homePageLocators.forkAppFromMenu).click({ force: true });
      cy.get(".rc-select-selector").click();
      cy.get(
        `.rc-select-item-option-content:contains('${workspaceName}')`,
      ).click();
      cy.get(homePageLocators.forkAppWorkspaceButton).click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(4000);
      cy.wait("@postForkAppWorkspace").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });

    it("2. Verify user with multiple permission(create for workspace1 and edit for workspace2) works as expected", function () {
      // verify user has create permission for workspace1
      cy.get(homePageLocators.homeIcon).click({ force: true });
      cy.get(homePageLocators.searchInput).clear().type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).click();
      cy.CheckAndUnfoldEntityItem("Pages");
      cy.Createpage("page2");
      cy.wait(1000);
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 200, y: 200 });
      cy.get(".t--widget-tablewidgetv2").should("exist");
      cy.NavigateToDatasourceEditor();
      cy.get(datasources.MySQL).click();
      cy.fillMySQLDatasourceForm();
      cy.generateUUID().then((UUID) => {
        datasourceName2 = `MySQL MOCKDS ${UUID}`;
        cy.renameDatasource(datasourceName2);
        cy.testSaveDatasource();
      });
      // verify user has edit permission for workspace 2
      cy.get(homePageLocators.homeIcon).click({ force: true });
      cy.get(homePageLocators.searchInput).clear().type(appName2);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).click();
    });

    it("3. Verify when user has edit role and delete role it works as expected", function () {
      // verify user is not able to export the app
      homePage.NavigateToHome();
      cy.get(homePageLocators.searchInput).clear().type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(RBAC.appMoreIcon).first().click({ force: true });
      cy.get(homePageLocators.exportAppFromMenu).should("not.exist");
    });

    it("4. Verify when user has appsmith provided role along with custom role it works as expected", function () {
      cy.LogOut();
      cy.LogintoAppTestUser(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).type(appName2);
      cy.wait(2000);
      // verify create new app button is not visible to user
      cy.get(homePageLocators.createNewAppButton).should("not.exist");
      // verify user don't see create new CTAs
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).click();
      cy.wait(2000);
      cy.wait("@getWorkspace");
      onboarding.closeIntroModal();
      // verify user is able to edit exisitng api
      EditorNavigation.SelectEntityByName(APIName, EntityType.Api);
      cy.get(apiwidget.headerKey).type("info");
      cy.SaveAndRunAPI();
      cy.ResponseStatusCheck("200");
      // verify user is able to edit jsObject
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      cy.wait(1000);
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("{downarrow}{downarrow}{downarrow}  ")
        .type("testJSFunction:()=>{},");
      cy.wait(1000);
      cy.get(jsEditorLocators.runButton).first().click();
    });

    after(() => {
      cy.LogOut();
      cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({
        license_gac_enabled: true,
      });
      cy.wait(2000);
      cy.visit("/settings/roles");
      cy.DeleteRole(CreatePermission);
      cy.DeleteRole(EditPermission);
    });
  },
);
