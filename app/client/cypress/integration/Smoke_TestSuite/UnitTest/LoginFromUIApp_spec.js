const homePage = require("../../../locators/HomePage.json");
const HelpLocators = require("../../../locators/HelpLocators.json");
let pageid;
let appId;

describe("Login from UI and check the functionality", function() {
  it("Login/create page/delete page/delete app from UI", function() {
    const appname = localStorage.getItem("AppName");
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appname);
    cy.get("#loading").should("not.exist");

    cy.generateUUID().then(uid => {
      pageid = uid;
      cy.Createpage(pageid);
      cy.DeletepageFromSideBar();
    });
    cy.wait("@deletePage");
    cy.get("@deletePage").should("have.property", "status", 200);
    cy.DeleteApp(appname);
    cy.wait("@deleteApplication");
    cy.get("@deleteApplication").should("have.property", "status", 200);
  });

  it("Login/Logout click Appsmith logo should route to login page", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.signOutIcon).click();
    cy.wait(500);
    cy.get(homePage.headerAppSmithLogo).click();
    cy.wait(500);
    cy.url().should("include", "user/login");
  });

  it("Theme change test and validation", function() {
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.themeText).should("have.attr", "value", "true");
    cy.get("span")
      .contains("Light")
      .click({ force: true });
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.themeText).should("have.attr", "value", "false");
    cy.get("span")
      .contains("Dark")
      .click({ force: true });
    cy.get(homePage.profileMenu).click();
    cy.get(homePage.themeText).should("have.attr", "value", "true");
  });

  it("Icon of fab button of help modal should change on open and close", function() {
    cy.get(HelpLocators.HelpButton).click();
    cy.get(`${HelpLocators.HelpButton} .bp3-icon-cross`).should(
      "have.length",
      1,
    );

    cy.get(HelpLocators.HelpButton).click();
    cy.get(`${HelpLocators.HelpButton} .bp3-icon-cross`).should(
      "have.length",
      0,
    );
  });
});
