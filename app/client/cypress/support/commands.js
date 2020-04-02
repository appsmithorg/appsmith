const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.visit("/");
  cy.get(loginPage.username).should("be.visible");
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword);
  cy.get(loginPage.submitBtn).click();
});

Cypress.Commands.add("SearchApp", appname => {
  cy.get(homePage.searchInput).type(appname);
  cy.get(homePage.appEditIcon).should("be.visible");
  cy.wait(2000);
  cy.get(homePage.appEditIcon)
    .first()
    .click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToCommonWidgets", () => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.xpath(pages.commonWidgets).click();
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToFormWidgets", () => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.xpath(pages.formWidgets).click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("PublishtheApp", () => {
  cy.xpath("//div[@id='root']").contains("All changes saved");
  cy.get(homePage.publishButton).click();
  cy.window().then(win => {
    cy.get(homePage.publishCrossButton).click();
  });
});
