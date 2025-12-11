import * as _ from "../../../../support/Objects/ObjectsCore";
import {
  agHelper,
  dataSources,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

describe(
  "Workspace Datasource Settings",
  { tags: ["@tag.Workspace", "@tag.Datasource", "@tag.Sanity"] },
  function () {
    const locator = ObjectsRegistry.CommonLocators;

    beforeEach(() => {
      // Start datasource routes
      dataSources.StartDataSourceRoutes();
    });

    it("1. Workspace menu Datasources option should show an empty list and available plugins", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        // Open the workspace menu (triple dot) and click the Datasources option
        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClick(locator.workspaceDatasources);

        assertHelper.AssertNetworkStatus("@getDataSources", 200);

        agHelper.AssertElementVisibility(locator.workspaceDatasourcesPage);

        // No datasources should be present yet
        cy.get(locator._datasource).should("have.length", 0);

        // Workspace datasources main blank state should be visible
        agHelper.AssertElementVisibility(locator._dataBlankState);

        // Blank state CTA should be visible
        agHelper.GetNClick(locator._addDatasourceButtonBlankScreen);

        // When blank state CTA is shown, the header + icon should NOT be visible
        agHelper.AssertElementAbsence(locator._addDatasourceButton);
      });
    });

    it("1.a Blank state CTA navigation should not show + icon on Connect a datasource page", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClick(locator.workspaceDatasources);

        assertHelper.AssertNetworkStatus("@getDataSources", 200);

        // Click the blank state CTA button (Bring your data)
        agHelper.GetNClick(locator._addDatasourceButtonBlankScreen);

        // We should be on the Connect a datasource page
        cy.location("pathname").should(
          "match",
          /^\/workspace\/[^/]+\/datasources\/NEW$/,
        );

        // On Connect a datasource page, the header + icon should NOT be visible
        agHelper.AssertElementAbsence(locator._addDatasourceButton);
      });
    });

    it("2. Should allow adding DB and REST API datasources from workspace settings", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        cy.intercept("POST", "/api/v1/datasources/mocks").as(
          "addMockDatasource",
        );

        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClick(locator.workspaceDatasources);

        assertHelper.AssertNetworkStatus("@getDataSources", 200);

        agHelper.GetNClick(locator._addDatasourceButtonBlankScreen);

        cy.contains(locator._mockDatasourceName, "Users")
          .should("be.visible")
          .click();

        assertHelper.AssertNetworkStatus("@addMockDatasource", 200);

        cy.location("pathname").should(
          "match",
          /^\/workspace\/[^/]+\/datasource\/[^/]+$/,
        );
        cy.contains("View data").should("be.visible");
        cy.contains("Configurations").should("be.visible");
        cy.contains("button", "Edit").should("be.visible");

        agHelper.GetNClick(dataSources._addNewDataSource, 0, true);
        agHelper.AssertElementVisibility(locator._newIntegrationsWrapper);

        cy.contains(locator._datasourceName, "Authenticated API")
          .scrollIntoView()
          .should("be.visible")
          .click({ force: true });

        agHelper.RenameDatasource("Mock API");
        agHelper.TypeText("input[name='url']", "https://mock-api.appsmith.com");

        agHelper.GetNClick(dataSources._saveDs);
        assertHelper.AssertNetworkStatus("@saveDatasource", 201);

        cy.contains("button", "Edit").should("be.visible");
        cy.get(locator._datasource).contains("Users").should("be.visible");
        cy.get(locator._datasource).contains("Mock API").should("be.visible");
        cy.get(locator._datasource).should("have.length.at.least", 2);
      });
    });

    it("3. Should support deleting workspace datasources via the context menu", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        cy.intercept("POST", "/api/v1/datasources/mocks").as(
          "addMockDatasource",
        );

        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClick(locator.workspaceDatasources);
        assertHelper.AssertNetworkStatus("@getDataSources", 200);

        agHelper.GetNClick(locator._addDatasourceButtonBlankScreen);

        cy.contains(locator._mockDatasourceName, "Users")
          .should("be.visible")
          .click();

        assertHelper.AssertNetworkStatus("@addMockDatasource", 200);

        cy.location("pathname").should(
          "match",
          /^\/workspace\/[^/]+\/datasource\/[^/]+$/,
        );
        cy.contains("View data").should("be.visible");
        cy.contains("Configurations").should("be.visible");
        cy.contains("button", "Edit").should("be.visible");

        agHelper.GetNClick(locator._contextMenuTrigger, 0, true);

        agHelper.GetNClick(locator._datasourceOptionDelete, 0, true);

        cy.contains("span", "Are you sure?")
          .should("be.visible")
          .click({ force: true });
        assertHelper.AssertNetworkStatus("@deleteDatasource", 200);

        cy.get(locator._datasource).should("have.length", 0);
        cy.contains("Connect a datasource").should("be.visible");
      });
    });

    it("4. Should keep edits when saving changes from the discard dialog", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        cy.intercept("POST", "/api/v1/datasources/mocks").as(
          "addMockDatasource",
        );

        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClick(locator.workspaceDatasources);
        assertHelper.AssertNetworkStatus("@getDataSources", 200);

        agHelper.GetNClick(locator._addDatasourceButtonBlankScreen);

        cy.contains(locator._mockDatasourceName, "Users")
          .should("be.visible")
          .click();
        assertHelper.AssertNetworkStatus("@addMockDatasource", 200);

        agHelper.GetNClick(dataSources._addNewDataSource, 0, true);
        agHelper.AssertElementVisibility(locator._newIntegrationsWrapper);

        cy.contains(locator._datasourceName, "Authenticated API")
          .scrollIntoView()
          .should("be.visible")
          .click({ force: true });

        agHelper.RenameDatasource("Mock API");
        agHelper.TypeText("input[name='url']", "https://mock-api.appsmith.com");

        agHelper.GetNClick(dataSources._saveDs);
        assertHelper.AssertNetworkStatus("@saveDatasource", 201);

        cy.contains("button", "Edit").should("be.visible").click();

        agHelper.TypeText(
          `${locator._headersArray} input[name$='.key']`,
          "Content-Type",
        );
        agHelper.TypeText(
          `${locator._headersArray} input[name$='.value']`,
          "application/json",
        );

        agHelper.GetNClick(locator._cancelEditDatasource);
        cy.contains(".ads-v2-modal__content-header", "Are you sure?").should(
          "be.visible",
        );
        agHelper.GetNClick(locator._datasourceModalSave);
        assertHelper.AssertNetworkStatus("@updateDatasource", 200);

        cy.contains("button", "Edit").should("be.visible");
        cy.contains(locator._datasource, "Users").should("be.visible");
        cy.contains(locator._datasource, "Mock API").should("be.visible");
      });
    });
  },
);
