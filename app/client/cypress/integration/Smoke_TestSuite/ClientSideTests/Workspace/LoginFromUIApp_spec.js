import homePage from "../../../../locators/HomePage";
const pages = require("../../../../locators/Pages.json");

let pageid;

describe("Login from UI and check the functionality", function() {
  it("Login/create page/delete page/delete app from UI", function() {
    const appname = localStorage.getItem("AppName");
    cy.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.SearchApp(appname);
    cy.get("#loading").should("not.exist");
    cy.wait(30000);
    cy.generateUUID().then((uid) => {
      pageid = uid;
      cy.Createpage(pageid);
      cy.get(`.t--entity-name`)
        .contains(pageid)
        .trigger("mouseover");
      cy.hoverAndClick();
      cy.get(pages.deletePage)
        .first()
        .click({ force: true });
      cy.get(pages.deletePageConfirm)
        .first()
        .click({ force: true });
      cy.wait(2000);
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
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(homePage.headerAppSmithLogo).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.url().should("include", "user/login");
  });
});
