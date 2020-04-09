const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");
const commonlocators = require("../locators/commonlocators.json");
const modalWidgetPage = require("../locators/ModalWidget.json");

Cypress.Commands.add("LogintoApp", (uname, pword) => {
  cy.visit("/");
  cy.get(loginPage.username).should("be.visible");
  cy.get(loginPage.username).type(uname);
  cy.get(loginPage.password).type(pword);
  cy.get(loginPage.submitBtn).click();
});

Cypress.Commands.add("SearchApp", appname => {
  cy.get(homePage.searchInput).type(appname);
  cy.wait(2000);
  cy.get(homePage.appEditIcon)
    .first()
    .click({ force: true });
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToCommonWidgets", () => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(pages.commonWidgets)
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToFormWidgets", () => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(pages.formWidgets)
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToViewWidgets", () => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(pages.viewWidgets)
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pages.widgetsEditor).click();
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("CreateModal", () => {
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
  cy.get(modalWidgetPage.controlModalType)
    .find(".bp3-button")
    .click({ force: true })
    .get("ul.bp3-menu")
    .children()
    .contains("Alert Modal")
    .click();
  cy.get(modalWidgetPage.controlModalType)
    .find(".bp3-button > .bp3-button-text")
    .should("have.text", "Alert Modal");
  cy.get(commonlocators.editPropCrossButton).click();
  cy.get(modalWidgetPage.modalWidget)
    .get(commonlocators.deleteWidgetIcon)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("PublishtheApp", () => {
  cy.xpath(homePage.homePageID).contains("All changes saved");
  cy.get(homePage.publishButton).click();
  cy.window().then(win => {
    cy.get(homePage.publishCrossButton).click();
  });
});
