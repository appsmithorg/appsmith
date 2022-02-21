const homePage = require("../../../locators/HomePage.json");
const dsl = require("../../../fixtures/forkedApp.json");

describe("Import, Export and Fork application and validate data binding", function() {
  let orgid;
  let appid;
  let newOrganizationName;
  it("Import application and validate data on pageload", function() {
    // import application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.optionsIcon)
      .first()
      .click();
    cy.get(homePage.orgImportAppOption).click({ force: true });
    cy.get(homePage.orgImportAppModal).should("be.visible");
    cy.xpath(homePage.uploadLogo).attachFile("forkedApp.json");
    cy.get(homePage.orgImportAppButton).click({ force: true });
    cy.wait("@importNewApplication").then((interception) => {
      let appId = interception.response.body.data.id;
      let defaultPage = interception.response.body.data.pages.find(
        (eachPage) => !!eachPage.isDefault,
      );
      cy.get(homePage.toastMessage).should(
        "contain",
        "Application imported successfully",
      );
      const uuid = () => Cypress._.random(0, 1e4);
      const name = uuid();
      cy.wait(2000);
      cy.get(homePage.applicationName)
        .clear()
        .type(`app${name}`);
      cy.wrap(`app${name}`).as("appname");
      cy.wait(2000);
      // validating data binding for the imported application
      cy.xpath("//input[@value='Submit']").should("be.visible");
      cy.xpath("//div[text()='schema_name']").should("be.visible");
      cy.xpath("//div[text()='pg_toast']").should("be.visible");
      cy.xpath("//div[text()='title']").should("be.visible");
      cy.xpath("//div[text()='Recusan']").should("be.visible");
    });
  });

  it("Fork application and validate data binding for the widgets", function() {
    // fork application
    cy.get(homePage.homeIcon).click();
    cy.get(homePage.searchInput).type(`${this.appname}`);
    cy.wait(2000);
    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.forkAppFromMenu).click({ force: true });
    cy.get(homePage.forkAppOrgList)
      .children()
      .last()
      .click({ force: true });
    cy.get(homePage.forkAppOrgButton).click({ force: true });
    cy.wait(4000);
    // validating data binding for the forked application
    cy.xpath("//input[@value='Submit']").should("be.visible");
    cy.xpath("//div[text()='schema_name']").should("be.visible");
    cy.xpath("//div[text()='pg_toast']").should("be.visible");
    cy.xpath("//div[text()='title']").should("be.visible");
    cy.xpath("//div[text()='Recusan']").should("be.visible");
  });

  it("Export and import application and validate data binding for the widgets", function() {
    cy.NavigateToHome();
    cy.get(homePage.searchInput)
      .clear()
      .type(`${this.appname}`);
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
          `attachment; filename*=UTF-8''${this.appname}.json`,
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
            cy.xpath(homePage.uploadLogo).attachFile("exportedApp.json");
            // import exported application in new organization
            cy.get(homePage.orgImportAppButton).click({ force: true });
            cy.wait("@importNewApplication").then((interception) => {
              let appId = interception.response.body.data.id;
              let defaultPage = interception.response.body.data.pages.find(
                (eachPage) => !!eachPage.isDefault,
              );
              cy.get(homePage.toastMessage).should(
                "contain",
                "Application imported successfully",
              );
              // validating data binding for imported application
              cy.xpath("//input[@value='Submit']").should("be.visible");
              cy.xpath("//div[text()='schema_name']").should("be.visible");
              cy.xpath("//div[text()='pg_toast']").should("be.visible");
              cy.xpath("//div[text()='title']").should("be.visible");
              cy.xpath("//div[text()='Recusan']").should("be.visible");

              cy.url().should(
                "include",
                `/applications/${appId}/pages/${defaultPage.id}/edit`,
              );
            });
          });
        });
      });
    });
  });
});
