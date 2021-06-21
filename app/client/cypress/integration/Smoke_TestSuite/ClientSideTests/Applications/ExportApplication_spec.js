const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Export application as a JSON file", function() {
  let orgid;
  let appid;
  let currentUrl;
  let newOrganizationName;
  let appname;

  before(() => {
    cy.addDsl(dsl);
  });

  it("Check if exporting app flow works as expected", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    appname = localStorage.getItem("AppName");
    cy.get(homePage.searchInput).type(appname);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    cy.get(homePage.applicationCard)
      .first()
      .trigger("mouseover");
    cy.get(homePage.appMoreIcon)
      .first()
      .click({ force: true });
    cy.get(homePage.exportAppFromMenu).click({ force: true });
    cy.get(homePage.toastMessage).should("contain", "Successfully exported");
    cy.LogOut();
  });

  it("User with admin access,should be able to export the app", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
      });
      cy.CreateAppForOrg(orgid, appid);
      cy.wait("@getPagesForCreateApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get("h2").contains("Drag and drop a widget here");
      cy.get(homePage.shareApp).click({ force: true });
      cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.adminRole);

      cy.LogOut();

      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.NavigateToHome();
      cy.wait(2000);
      cy.log({ appid });
      cy.get(homePage.searchInput).type(appid);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);

      cy.get(homePage.applicationCard)
        .first()
        .trigger("mouseover");
      cy.get(homePage.appMoreIcon)
        .first()
        .click({ force: true });
      cy.get(homePage.exportAppFromMenu).should("be.visible");
    });
    cy.LogOut();
  });

  it("User with developer access,should not be able to export the app", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
      });
      cy.CreateAppForOrg(orgid, appid);
      cy.wait("@getPagesForCreateApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get("h2").contains("Drag and drop a widget here");
      cy.get(homePage.shareApp).click({ force: true });
      cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.developerRole);

      cy.LogOut();

      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.NavigateToHome();
      cy.wait(2000);
      cy.log({ appid });
      cy.get(homePage.searchInput).type(appid);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);

      cy.get(homePage.applicationCard)
        .first()
        .trigger("mouseover");
      cy.get(homePage.appMoreIcon)
        .first()
        .click({ force: true });
      cy.get(homePage.exportAppFromMenu).should("not.exist");
    });
    cy.LogOut();
  });

  it("User with viewer access,should not be able to export the app", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.NavigateToHome();
    cy.generateUUID().then((uid) => {
      orgid = uid;
      appid = uid;
      localStorage.setItem("OrgName", orgid);
      cy.createOrg();
      cy.wait("@createOrg").then((interception) => {
        newOrganizationName = interception.response.body.data.name;
        cy.renameOrg(newOrganizationName, orgid);
      });
      cy.CreateAppForOrg(orgid, appid);
      cy.wait("@getPagesForCreateApp").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      cy.get("h2").contains("Drag and drop a widget here");
      cy.get(homePage.shareApp).click({ force: true });
      cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.viewerRole);

      cy.LogOut();

      cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
      cy.NavigateToHome();
      cy.wait(2000);
      cy.log({ appid });
      cy.get(homePage.searchInput).type(appid);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);

      cy.get(homePage.applicationCard)
        .first()
        .trigger("mouseover");
      cy.get(homePage.appEditIcon).should("not.exist");
    });
    cy.LogOut();
  });
});
