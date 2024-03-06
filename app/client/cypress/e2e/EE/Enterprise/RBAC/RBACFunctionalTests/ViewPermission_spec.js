import homePageLocators from "../../../../../locators/HomePage";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
const datasources = require("../../../../../locators/DatasourcesEditor.json");
const testdata = require("../../../../../fixtures/testdata.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const pages = require("../../../../../locators/Pages.json");
const appNavigationLocators = require("../../../../../locators/AppNavigation.json");
import {
  agHelper,
  homePage,
  dataSources,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
let currentUrl;

describe(
  "View Permission flow ",
  { tags: ["@tag.AccessControl"] },
  function () {
    let workspaceName;
    let appName;
    let newWorkspaceName;
    let testUser3;
    let testUser4;
    let datasourceName;
    const password = "qwerty";
    const PermissionWorkspaceLevel =
      "ViewPermissionWorkspaceLevel" + `${Math.floor(Math.random() * 1000)}`;
    const PermissionAppLevel =
      "ViewPermissionAppLevel" + `${Math.floor(Math.random() * 1000)}`;
    const PermissionPageLevel =
      "ViewPermissionPageLevel" + `${Math.floor(Math.random() * 1000)}`;
    const PermissionQueryLevel =
      "ViewPermissionQueryLevel" + `${Math.floor(Math.random() * 1000)}`;
    let AppName2;

    beforeEach(() => {
      cy.AddIntercepts();
    });

    before(() => {
      cy.AddIntercepts();
      cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      homePage.NavigateToHome();
      cy.generateUUID().then((uid) => {
        workspaceName = uid;
        appName = uid + "view";
        localStorage.setItem("WorkspaceName", workspaceName);
        cy.createWorkspace();
        cy.wait("@createWorkspace").then((interception) => {
          newWorkspaceName = interception.response.body.data.name;
          homePage.RenameWorkspace(newWorkspaceName, workspaceName);

          cy.CreateAppForWorkspace(workspaceName, appName);
          // create new datasource
          dataSources.CreateDataSource("Postgres");
          agHelper.GenerateUUID();
          cy.get("@guid").then((uid) => {
            datasourceName = `Postgres CRUD ds ${uid}`;
            cy.renameDatasource(datasourceName);
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
            cy.CheckAndUnfoldEntityItem("Pages");
            cy.Createpage("page2");
            // verify user is able to create new query
            cy.CreateAPI("Api123");
            cy.enterDatasourceAndPath(
              testdata.baseUrl,
              "/mock-api?records=20&page=4&size=3",
            );
            cy.SaveAndRunAPI();
            cy.ResponseStatusCheck("200");
            deployMode.DeployApp();
            cy.get(publishPage.backToEditor).click({ force: true });
            homePage.NavigateToHome();

            cy.generateUUID().then((uid) => {
              AppName2 = uid + "pg";

              cy.CreateAppForWorkspace(workspaceName, AppName2);
            });
            cy.wait(2000);
            cy.visit("settings/general");

            cy.ViewPermissionWorkspaceLevel(
              PermissionWorkspaceLevel,
              workspaceName,
            );
            // add make public permission as well
            cy.get(RBAC.roleRow).first().click();
            cy.wait("@fetchRoles").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            // check the make public role
            cy.contains("td", `${workspaceName}`)
              .next()
              .next()
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
            cy.wait(2000);
            cy.ViewPermissionAppLevel(
              PermissionAppLevel,
              workspaceName,
              appName,
            );
            cy.ViewPermissionPageLevel(
              PermissionPageLevel,
              workspaceName,
              appName,
              "page2",
            );
            cy.ViewPermissionQueryLevel(
              PermissionQueryLevel,
              workspaceName,
              appName,
              "page2",
              "Api123",
            );
            cy.wait(2000);
            cy.AssignRoleToUser(
              PermissionWorkspaceLevel,
              Cypress.env("TESTUSERNAME1"),
            );
            cy.AssignRoleToUser(
              PermissionAppLevel,
              Cypress.env("TESTUSERNAME2"),
            );
            cy.generateUUID().then((uid) => {
              testUser3 = `${uid}@appsmith.com`;
              cy.AssignRoleToUser(PermissionPageLevel, testUser3);
              cy.wait(2000);
            });
            cy.generateUUID().then((uid) => {
              testUser4 = `${uid}@appsmith.com`;
              cy.AssignRoleToUser(PermissionQueryLevel, testUser4);
              cy.wait(2000);
              cy.LogOut();
            });
          });
        });
      });
    });

    it("1. View permission : Workspace level (View all apps in same workspace)", function () {
      cy.LogintoAppTestUser(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
      );
      agHelper.ClearNType(homePageLocators.searchInput, appName);
      cy.wait(2000);
      cy.get(homePageLocators.appsContainer).contains(workspaceName);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).should("not.exist");
      cy.launchApp();
      cy.get(homePageLocators.backtoHome).click({ force: true });
      cy.wait(2000);
      agHelper.ClearNType(homePageLocators.searchInput, AppName2);
      cy.wait(2000);
      cy.get(homePageLocators.appsContainer).contains(workspaceName);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).should("not.exist");
      cy.launchApp();
    });

    it("2.Verify user with make Public permission, is able to make app public", function () {
      agHelper.VisitNAssert("/applications", "getAllWorkspaces");
      agHelper.ClearNType(homePageLocators.searchInput, AppName2);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.launchApp();
      cy.wait(2000);
      cy.get(
        `${appNavigationLocators.header} ${appNavigationLocators.shareButton}`,
      ).click();
      cy.enablePublicAccess();
      currentUrl = cy.url();
      cy.url().then((url) => {
        currentUrl = url;
        cy.log(currentUrl);
        cy.LogOut();
        agHelper.VisitNAssert(currentUrl, "getPagesForViewApp");
        cy.wait(3000);
        cy.get(publishPage.pageInfo)
          .invoke("text")
          .then((text) => {
            const someText = text;
            expect(someText).to.equal("This page seems to be blank");
          });
      });
    });

    it("3.View permission : App level (View that app only)", function () {
      cy.LogintoAppTestUser(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      cy.get(homePageLocators.searchInput).type(AppName2);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).should("not.exist");
      cy.get(homePageLocators.searchInput).clear().type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.appsContainer).contains(workspaceName);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).should("not.exist");
      cy.launchApp();
      cy.get(homePageLocators.backtoHome).eq(0).click({ force: true });
      cy.LogOut();
    });

    // Bug # 26373
    it.skip("4. View permission : Page level (View page is visible)", function () {
      cy.SignupFromAPI(testUser3, password);
      cy.LogintoAppTestUser(testUser3, password);
      cy.get(homePageLocators.searchInput).type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.appsContainer).contains(workspaceName);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).should("not.exist");
      cy.launchApp();
      cy.get(".t--page-switch-tab").should("not.contain", "page2");
    });

    it("5. View permission : Query level (View query is visible and executes without getting stuck) (Bug: 19253)", function () {
      cy.SignupFromAPI(testUser4, password);
      cy.LogintoAppTestUser(testUser4, password);
      cy.get(homePageLocators.searchInput).type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.appsContainer).contains(workspaceName);
      cy.get(homePageLocators.applicationCard).trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).should("exist").click();
      cy.wait(3000);
      EditorNavigation.SelectEntityByName("page2", EntityType.Page);
      cy.get(".t--entity-name:contains('page2')").click();
      cy.wait(3000);
      EditorNavigation.SelectEntityByName("Api123", EntityType.Api);
      cy.RunAPI();
    });

    after(() => {
      cy.LogOut();
      cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      cy.visit("/settings/roles");
      cy.DeleteRole(PermissionWorkspaceLevel);
      cy.DeleteRole(PermissionAppLevel);
      cy.DeleteRole(PermissionPageLevel);
      cy.DeleteUser(testUser3);
    });
  },
);
