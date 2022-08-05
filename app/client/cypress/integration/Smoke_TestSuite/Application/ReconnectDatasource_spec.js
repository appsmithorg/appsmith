const homePage = require("../../../locators/HomePage");
const reconnectDatasourceModal = require("../../../locators/ReconnectLocators");

describe("Reconnect Datasource Modal validation while importing application", function() {
  let workspaceId;
  let appid;
  let newWorkspaceName;
  let appName;
  it("Import application from json with one postgres and success modal", function() {
    cy.NavigateToHome();
    // import application
    cy.generateUUID().then((uid) => {
      workspaceId = uid;
      localStorage.setItem("WorkspaceName", workspaceId);
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((createWorkspaceInterception) => {
        newWorkspaceName = createWorkspaceInterception.response.body.data.name;
        cy.renameWorkspace(newWorkspaceName, workspaceId);
        cy.get(homePage.workspaceImportAppOption).click({ force: true });
        cy.get(homePage.workspaceImportAppModal).should("be.visible");
        cy.xpath(homePage.uploadLogo).attachFile("one_postgres.json");
        cy.wait("@importNewApplication").then((interception) => {
          cy.wait(100);
          // should check reconnect modal openning
          const { isPartialImport } = interception.response.body.data;
          if (isPartialImport) {
            // should reconnect modal
            cy.get(reconnectDatasourceModal.Modal).should("be.visible");
            cy.get(".t--ds-list .t--ds-list-title").should("be.visible");
            cy.get(".t--ds-list .t--ds-list-title").should(
              "have.text",
              "Untitled Datasource",
            );
            // not configured yet
            cy.get(".t--ds-list .cs-icon")
              .invoke("attr", "name")
              .should("eq", "info");
            // check db type
            cy.get(".t--ds-list").contains("PostgreSQL");
            // check the postgres form config with default value
            cy.get("[data-cy='section-Connection']").should("be.visible");
            cy.get("[data-cy='section-Authentication']").should("be.visible");
            cy.get("[data-cy='section-SSL (optional)']").should("be.visible");
            cy.get(
              "[data-cy='datasourceConfiguration.connection.mode']",
            ).should("contain", "Read / Write");
            cy.get("[data-cy='section-SSL (optional)']").click({ force: true });
            // should expand ssl pan
            cy.get(
              "[data-cy='datasourceConfiguration.connection.ssl.authType']",
            ).should("contain", "Default");

            cy.ReconnectDatasource("Untitled Datasource");
            cy.wait(1000);
            cy.fillPostgresDatasourceForm();
            cy.testSaveDatasource();
            cy.wait(2000);

            // cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
            //   force: true,
            // });
            // cy.wait(2000);
          } else {
            cy.get(homePage.toastMessage).should(
              "contain",
              "Application imported successfully",
            );
          }
          // check datasource configured success modal
          cy.get(".t--import-app-success-modal").should("be.visible");
          cy.get(".t--import-app-success-modal").should(
            "contain",
            "All your datasources are configured and ready to use.",
          );
          cy.get(".t--import-success-modal-got-it").click({ force: true });
          cy.get(".t--import-app-success-modal").should("not.exist");

          const uuid = () => Cypress._.random(0, 1e4);
          const name = uuid();
          appName = `app${name}`;
          cy.get(homePage.applicationName).click({ force: true });
          cy.get(`${homePage.applicationEditMenu} li:first-child a`).click({
            force: true,
          });
          cy.wait(2000);
          cy.get(homePage.applicationName)
            // .clear()
            .type(appName);
        });
      });
    });
  });
});
