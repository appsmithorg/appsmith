const homePage = require("../../../locators/HomePage");
const reconnectDatasourceModal = require("../../../locators/ReconnectLocators");

describe("Import, Export and Fork application and validate data binding", function() {
  let orgid;
  let appid;
  let newOrganizationName;
  let appName;
  it("Import application from json and validate data on pageload", function() {
    // import application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(homePage.orgImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("forkedApp.json");
    cy.wait("@importNewApplication").then((interception) => {
      cy.wait(100);
      // should check reconnect modal openning
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect button
        cy.get(reconnectDatasourceModal.Modal).should("be.visible");
        cy.get(reconnectDatasourceModal.SkipToAppBtn).click({ force: true });
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
        .clear()
        .type(appName);
      cy.wrap(appName).as("appname");
      cy.wait(2000);
      // validating data binding for the imported application
      cy.xpath("//input[@value='Submit']").should("be.visible");
      cy.xpath("//div[text()='schema_name']").should("be.visible");
      cy.xpath("//div[text()='id']").should("be.visible");
      cy.xpath("//div[text()='title']").should("be.visible");
      cy.xpath("//div[text()='due']").should("be.visible");
    });
  });

  it("Fork application and validate data binding for the widgets", function() {
    // fork application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.searchInput).type(`${appName}`);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.forkAppFromMenu).click({ force: true });
    cy.get(homePage.forkAppOrgButton).click({ force: true });
    cy.wait(4000);
    // validating data binding for the forked application
    cy.xpath("//input[@value='Submit']").should("be.visible");
    cy.xpath("//div[text()='schema_name']").should("be.visible");
    cy.xpath("//div[text()='id']").should("be.visible");
    cy.xpath("//div[text()='title']").should("be.visible");
    cy.xpath("//div[text()='due']").should("be.visible");
  });

  it("Export and import application and validate data binding for the widgets", function() {
    cy.NavigateToHome();
    cy.get(homePage.searchInput)
      .clear()
      .type(`${appName}`);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    // export application
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.searchInput).clear();
    cy.get(`a[id=t--export-app-link]`).then((anchor) => {
      const url = anchor.prop("href");
      cy.request(url).then(({ body, headers }) => {
        expect(headers).to.have.property("content-type", "application/json");
        expect(headers).to.have.property(
          "content-disposition",
          `attachment; filename*=UTF-8''${appName}.json`,
        );
        cy.writeFile("cypress/fixtures/exportedApp.json", body, "utf-8");
        cy.generateUUID().then((uid) => {
          orgid = uid;
          localStorage.setItem("OrgName", orgid);
          cy.createOrg();
          cy.wait("@createOrg").then((createOrgInterception) => {
            newOrganizationName = createOrgInterception.response.body.data.name;
            cy.renameOrg(newOrganizationName, orgid);
            cy.get(homePage.orgImportAppOption).click({ force: true });

            cy.get(homePage.orgImportAppModal).should("be.visible");
            // cy.get(".t--import-json-card input").attachFile("exportedApp.json");
            cy.xpath(homePage.uploadLogo).attachFile("exportedApp.json");
            // import exported application in new organization
            // cy.get(homePage.orgImportAppButton).click({ force: true });
            cy.wait("@importNewApplication").then((interception) => {
              const { isPartialImport } = interception.response.body.data;
              if (isPartialImport) {
                // should reconnect button
                cy.get(reconnectDatasourceModal.Modal).should("be.visible");
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
              const importedApp = interception.response.body.data.application;
              const appSlug = importedApp.slug;
              cy.wait("@getPagesForCreateApp").then((interception) => {
                const pages = interception.response.body.data.pages;
                let defaultPage = pages.find(
                  (eachPage) => !!eachPage.isDefault,
                );
                // validating data binding for imported application
                cy.xpath("//input[@value='Submit']").should("be.visible");
                cy.xpath("//div[text()='schema_name']").should("be.visible");
                // cy.xpath("//div[text()='information_schema']").should(
                //   "be.visible",
                // );
                cy.xpath("//div[text()='id']").should("be.visible");
                cy.xpath("//div[text()='title']").should("be.visible");
                cy.xpath("//div[text()='due']").should("be.visible");

                cy.url().should(
                  "include",
                  `/${appSlug}/${defaultPage.slug}-${defaultPage.id}/edit`,
                );
              });
            });
          });
        });
      });
    });
  });
});
