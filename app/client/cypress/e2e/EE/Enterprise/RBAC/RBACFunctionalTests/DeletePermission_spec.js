import {
  entityExplorer,
  entityItems,
  homePage,
  agHelper,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";
const generatePage = require("../../../../../locators/GeneratePage.json");
const RBAC = require("../../../../../locators/RBAClocators.json");
import homePageLocators from "../../../../../locators/HomePage";
const datasources = require("../../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Delete Permission flow ",
  { tags: ["@tag.AccessControl"] },
  function () {
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
        homePage.NavigateToHome();
        cy.generateUUID().then((uid) => {
          workspaceName = uid;
          appName = uid + "del";
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

            cy.createJSObject('return "Success";');
            cy.createJSObject('return "Yo";');
            // create new page and add JSObject
            cy.CheckAndUnfoldEntityItem("Pages");
            cy.Createpage("page2");
            cy.wait(2000);
            agHelper.VisitNAssert("/settings/general", "getEnvVariables");
            featureFlagIntercept({
              license_gac_enabled: true,
            });
            cy.wait(2000);
            cy.DeletePermissionWorkspaceLevel(
              PermissionWorkspaceLevel,
              workspaceName,
            );
            cy.get(RBAC.roleRow).first().click();
            cy.wait("@fetchRoles").should(
              "have.nested.property",
              "response.body.responseMeta.status",
              200,
            );
            // check the delete datasource role
            cy.get(RBAC.dataSourcesandQueriesTab).click();
            cy.contains("td", `${workspaceName}`).click();
            cy.contains("td", "Datasources")
              .next()
              .next()
              .next()
              .next()
              .click();
            cy.contains("td", "Environments").next().click();
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
            cy.AssignRoleToUser(
              PermissionAppLevel,
              Cypress.env("TESTUSERNAME2"),
            );
            cy.AssignRoleToUser(PermissionPageLevel, testUser3);
            // create another app in same workspace
            homePage.NavigateToHome();
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

    it("1. Delete permission : App level (Delete any page in same app, delete action)", function () {
      // login as exisiting user and verify user is able to delete page in same app
      cy.LogintoAppTestUser(
        Cypress.env("TESTUSERNAME2"),
        Cypress.env("TESTPASSWORD2"),
      );
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).click();
      cy.wait(2000);
      cy.CheckAndUnfoldEntityItem("Pages");
      EditorNavigation.SelectEntityByName("Public.users", EntityType.Page);
      cy.wait(4000);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // verify deletion of query
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "DeleteQuery",
        action: "Delete",
        entityType: entityItems.Query,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "SelectQuery",
        action: "Delete",
        entityType: entityItems.Query,
      });
      cy.CheckAndUnfoldEntityItem("Pages");
      cy.Deletepage("page2");
      // verify page is deleted
      PageLeftPane.assertAbsence(page2);
    });

    it("2. Delete permission : App level; verify user don't have create permissions", function () {
      // verify create button does not exist
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);

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

    it("3. Delete permission : Page level (Delete query in same page)", function () {
      cy.SignupFromAPI(testUser3, password);
      cy.LogintoAppTestUser(testUser3, password);
      cy.wait(2000);
      // verify deletion of jsObject
      cy.get(homePageLocators.searchInput).type(appName);
      cy.wait(2000);
      cy.get(homePageLocators.applicationCard).first().trigger("mouseover");
      cy.get(homePageLocators.appEditIcon).click();
      cy.wait(2000);
      cy.CheckAndUnfoldEntityItem("Pages");
      EditorNavigation.SelectEntityByName("Public.users", EntityType.Page);
      cy.wait(4000);
      // verify query deletion
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "UpdateQuery",
        action: "Delete",
        entityType: entityItems.Query,
      });
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
      PageLeftPane.assertAbsence("JSObject1");
    });

    it("4. Delete permission : Page level, verify user do not have create and edit permissions", function () {
      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);

      // verify create button does not exist
      cy.get(explorer.AddPage).should("not.exist");
      cy.get(explorer.addDBQueryEntity).should("not.exist");
      cy.get(explorer.addEntityJSEditor).should("not.exist");
      cy.get(homePageLocators.homeIcon).click({ force: true });
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).type(appName);
      // verify create new app button is not visible to user
      cy.get(homePageLocators.createNewAppButton).should("not.exist");
      cy.LogOut();
    });

    it("5. Delete permission : Workspace level and delete datasource permission", function () {
      // verify user can delete the datasource
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
      EditorNavigation.SelectEntityByName("Public.users", EntityType.Page);
      cy.wait(4000);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "InsertQuery",
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(datasourceName);

      featureFlagIntercept({ license_gac_enabled: true });
      cy.wait(2000);
      AppSidebar.navigate(AppSidebarButton.Editor);
      // verify create button does not exist
      cy.get(explorer.AddPage).should("not.exist");
      cy.get(explorer.addDBQueryEntity).should("not.exist");
      cy.get(explorer.addEntityJSEditor).should("not.exist");
      cy.get(homePageLocators.homeIcon).click({ force: true });
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).clear().type(appName);
      // verify create new app button is not visible to user
      cy.get(homePageLocators.createNewAppButton).should("not.exist");
    });

    it("6. Delete permission : Workspace level, verify user is able to delete app", function () {
      // verify user is able to delete app in same workspace
      cy.get(commonlocators.homeIcon).click({ force: true });
      cy.wait(2000);
      cy.get(homePageLocators.searchInput).clear().type(appName2);
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
    });

    after(() => {
      cy.LogOut();
      cy.LogintoAppTestUser(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
      featureFlagIntercept({
        license_gac_enabled: true,
      });
      cy.wait(2000);
      agHelper.VisitNAssert("settings/roles", "fetchRoles");
      cy.DeleteRole(PermissionWorkspaceLevel);
      cy.DeleteRole(PermissionAppLevel);
      cy.DeleteRole(PermissionPageLevel);
      cy.DeleteUser(testUser3);
    });
  },
);
