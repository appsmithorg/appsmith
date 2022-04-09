const homePage = require("../../../locators/HomePage");
const reconnectDatasourceModal = require("../../../locators/ReconnectLocators");

describe("Reconnect Datasource Modal validation while importing application", function() {
  let orgid;
  let appid;
  let newOrganizationName;
  let appName;
  it("Import application from json with one postgres", function() {
    cy.NavigateToHome();
    // import application
    cy.generateUUID().then((uid) => {
      orgid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((createOrgInterception) => {
        newOrganizationName = createOrgInterception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
        cy.get(homePage.orgImportAppOption).click({ force: true });
        cy.get(homePage.orgImportAppModal).should("be.visible");
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
            cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
              force: true,
            });
            cy.wait(2000);
          } else {
            cy.get(homePage.toastMessage).should(
              "contain",
              "Application imported successfully",
            );
          }
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
