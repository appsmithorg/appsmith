/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Workspace features*/

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const themelocator = require("../locators/ThemeLocators.json");

Cypress.Commands.add("borderMouseover", (index, text) => {
  cy.get(themelocator.border)
    .eq(index)
    .trigger("mouseover");
  cy.wait(1000);
  cy.get(themelocator.popover).contains(text);
});

Cypress.Commands.add("shadowMouseover", (index, text) => {
  cy.xpath(themelocator.shadow)
    .eq(index)
    .trigger("mouseover");
  cy.wait(1000);
  cy.get(themelocator.popover).contains(text);
});

Cypress.Commands.add("colorMouseover", (index, text) => {
  cy.get(themelocator.color)
    .eq(index)
    .trigger("mouseover");
  cy.wait(2000);
  cy.get(themelocator.popover).contains(text);
});

Cypress.Commands.add("validateColor", (index, text) => {
  cy.get(themelocator.color)
    .eq(index)
    .click({ force: true });
  cy.wait(1000);
  cy.get(themelocator.inputColor).should("have.value", text);
  cy.wait(1000);
});

Cypress.Commands.add("chooseColor", (index, color) => {
  cy.get(themelocator.colorPicker)
    .eq(index)
    .click({ force: true });
  cy.get(color)
    .last()
    .click();
  cy.wait(2000);
});
