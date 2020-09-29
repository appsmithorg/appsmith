/// <reference types="Cypress" />

const homePage = require("../../../locators/HomePage.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/newFormDsl.json");
describe("Create new org and share with a user", function() {
  let appname;

  before(() => {
    appname = localStorage.getItem("AppName");
    cy.addDsl(dsl);
  });

  it("create org and then share with a user from Application share option within application", function() {
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.SearchApp(appname);
    cy.openPropertyPane("buttonwidget");
    cy.get(".t--application-share-btn").click();
    cy.shareApp(Cypress.env("TESTUSERNAME1"), homePage.viewerRole);
    cy.LogOut();
  });

  it("login as invited user and then validate viewer privilage", function() {
    cy.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
    cy.SearchApp(appname);
    cy.xpath(homePage.ShareBtn).should("not.exist");
    cy.get(homePage.applicationCard).trigger("mouseover");
    cy.get(homePage.appEditIcon).should("not.exist");
    cy.launchApp(appname);
    cy.LogOut();
  });
});
