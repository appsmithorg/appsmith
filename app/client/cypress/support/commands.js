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
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("SearchApp", appname => {
  cy.get(homePage.searchInput).type(appname);
  cy.wait(2000);
  cy.get(homePage.appEditIcon)
    .first()
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  // Wait added because after opening the application editor, sometimes it takes a little time.
});

Cypress.Commands.add("NavigateToPage", pageSelector => {
  cy.get(pages.pagesIcon).click({ force: true });
  cy.get(pages.allWidgets)
    .find(">div")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  cy.get(pageSelector).click();
  cy.wait("@getPage");
  cy.get("#loading").should("not.exist");
});

Cypress.Commands.add("NavigateToAllWidgets", () => {
  cy.NavigateToPage(pages.allWidgets);
});

Cypress.Commands.add("NavigateToCommonWidgets", () => {
  cy.NavigateToPage(pages.commonWidgets);
});

Cypress.Commands.add("NavigateToFormWidgets", () => {
  cy.NavigateToPage(pages.formWidgets);
});

Cypress.Commands.add("NavigateToViewWidgets", () => {
  cy.NavigateToPage(pages.viewWidgets);
});

// Cypress.Commands.add("CreateModal", () => {
//   cy.get(modalWidgetPage.selectModal).click();
//   cy.get(modalWidgetPage.createModalButton).click({ force: true });
//   cy.get(modalWidgetPage.controlModalType)
//     .find(".bp3-button")
//     .click({ force: true })
//     .get("ul.bp3-menu")
//     .children()
//     .contains("Alert Modal")
//     .click();
//   cy.get(modalWidgetPage.controlModalType)
//     .find(".bp3-button > .bp3-button-text")
//     .should("have.text", "Alert Modal");
//   cy.get(commonlocators.editPropCrossButton).click();
//   cy.get(modalWidgetPage.modalWidget)
//     .get(commonlocators.deleteWidgetIcon)
//     .first()
//     .click({ force: true });
// });

Cypress.Commands.add("PublishtheApp", () => {
  cy.xpath(homePage.homePageID).contains("All changes saved");
  cy.get(homePage.publishButton).click();
  cy.wait("@publishApp");
  cy.get(homePage.publishCrossButton).click();
});

Cypress.Commands.add("getCodeMirror", () => {
  return cy
    .get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}");
});

Cypress.Commands.add("testCodeMirror", value => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then($cm => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .first()
          .clear({
            force: true,
          });
        cy.wait("@updateLayout");
      }

      cy.get(".CodeMirror textarea")
        .first()
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      cy.wait("@updateLayout");
      cy.get(".CodeMirror textarea")
        .first()
        .should("have.value", value);
    });
});
