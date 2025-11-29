import * as _ from "../../../../support/Objects/ObjectsCore";
import { agHelper, dataSources } from "../../../../support/Objects/ObjectsCore";

describe(
  "Workspace Datasource Settings",
  { tags: ["@tag.Workspace", "@tag.Datasource", "@tag.Sanity"] },
  function () {
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
        agHelper.GetNClickByContains(".workspace-menu-item", "Datasources");

        cy.wait("@getDataSources");

        // No datasources should be present yet
        cy.get(".t--datasource").should("have.length", 0);

        // Workspace datasources main blank state should be visible
        cy.get(".t--data-blank-state").should("be.visible");

        // Blank state CTA should be visible
        cy.get(".t--add-datasource-button-blank-screen").should("be.visible");
        cy.contains("Connect a datasource").should("be.visible");

        // When blank state CTA is shown, the header + icon should NOT be visible
        cy.get(".t--add-datasource-button").should("not.exist");
      });
    });

    it("1.a Blank state CTA navigation should not show + icon on Connect a datasource page", function () {
      _.homePage.NavigateToHome();
      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        const workspaceId = String(uid);
        _.homePage.CreateNewWorkspace(workspaceId);

        _.homePage.OpenWorkspaceOptions(workspaceId);
        agHelper.GetNClickByContains(".workspace-menu-item", "Datasources");

        cy.wait("@getDataSources");

        // Click the blank state CTA button (Bring your data)
        cy.get(".t--add-datasource-button-blank-screen")
          .should("be.visible")
          .click();

        // We should be on the Connect a datasource page
        cy.url().should("match", /\/workspace\/[^/]+\/datasources\/NEW$/);

        // On Connect a datasource page, the header + icon should NOT be visible
        cy.get(".t--add-datasource-button").should("not.exist");
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
        agHelper.GetNClickByContains(".workspace-menu-item", "Datasources");

        cy.wait("@getDataSources");

        cy.contains("[data-testid='mockdatasource-name']", "Users")
          .should("be.visible")
          .click();

        cy.wait("@addMockDatasource");

        cy.url().should("match", /\/workspace\/[^/]+\/datasource\/[^/]+/);
        cy.contains("View data").should("be.visible");
        cy.contains("Configurations").should("be.visible");
        cy.contains("button", "Edit").should("be.visible");

        cy.wait(100);
        cy.get(".t--add-datasource-button").first().click({ force: true });
        cy.get("#new-integrations-wrapper").should("be.visible");

        cy.contains("[data-testid='datasource-name']", "Authenticated API")
          .scrollIntoView()
          .click({ force: true });

        agHelper.RenameDatasource("Mock API");
        cy.get("input[name='url']")
          .should("exist")
          .clear({ force: true })
          .type("https://mock-api.appsmith.com", { delay: 0 });

        cy.get(".t--save-datasource").click();
        cy.wait("@saveDatasource");

        cy.contains("button", "Edit").should("be.visible");
        cy.get(".t--datasource").contains("Users").should("be.visible");
        cy.get(".t--datasource").contains("Mock API").should("be.visible");
        cy.get(".t--datasource").should("have.length.at.least", 2);
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
        agHelper.GetNClickByContains(".workspace-menu-item", "Datasources");
        cy.wait("@getDataSources");

        cy.contains("[data-testid='mockdatasource-name']", "Users")
          .should("be.visible")
          .click();

        cy.wait("@addMockDatasource");

        cy.url().should("match", /\/workspace\/[^/]+\/datasource\/[^/]+/);
        cy.contains("View data").should("be.visible");
        cy.contains("Configurations").should("be.visible");
        cy.contains("button", "Edit").should("be.visible");

        cy.get("[data-testid='t--context-menu-trigger']")
          .should("be.visible")
          .click({ force: true });

        cy.get(".t--datasource-option-delete")
          .should("be.visible")
          .click({ force: true });

        cy.contains("span", "Are you sure?").click({ force: true });
        cy.wait("@deleteDatasource");

        cy.get(".t--datasource").should("have.length", 0);
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
        agHelper.GetNClickByContains(".workspace-menu-item", "Datasources");
        cy.wait("@getDataSources");

        cy.contains("[data-testid='mockdatasource-name']", "Users")
          .should("be.visible")
          .click();
        cy.wait("@addMockDatasource");

        cy.wait(100);
        cy.get(".t--add-datasource-button").first().click({ force: true });
        cy.get("#new-integrations-wrapper").should("be.visible");

        cy.contains("[data-testid='datasource-name']", "Authenticated API")
          .scrollIntoView()
          .click({ force: true });

        agHelper.RenameDatasource("Mock API");
        cy.get("input[name='url']")
          .should("exist")
          .clear({ force: true })
          .type("https://mock-api.appsmith.com", { delay: 0 });

        cy.get(".t--save-datasource").click();
        cy.wait("@saveDatasource");

        cy.contains("button", "Edit").should("be.visible").click();

        cy.get(".t--headers-array input[name$='.key']")
          .first()
          .clear({ force: true })
          .type("Content-Type", { delay: 0 });
        cy.get(".t--headers-array input[name$='.value']")
          .first()
          .clear({ force: true })
          .type("application/json", { delay: 0 });

        cy.get(".t--cancel-edit-datasource").click();
        cy.contains(".ads-v2-modal__content-header", "Are you sure?").should(
          "be.visible",
        );
        cy.get(".t--datasource-modal-save").click();
        cy.wait("@updateDatasource");

        cy.contains("button", "Edit").should("be.visible");
        cy.contains(".t--datasource", "Users").should("be.visible");
        cy.contains(".t--datasource", "Mock API").should("be.visible");
      });
    });
  },
);
