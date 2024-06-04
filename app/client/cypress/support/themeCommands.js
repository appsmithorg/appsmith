/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */
/* Contains all methods related to Workspace features*/

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const themelocator = require("../locators/ThemeLocators.json");
import { ObjectsRegistry } from "../support/Objects/Registry";

const theme = ObjectsRegistry.ThemeSettings;

Cypress.Commands.add("borderMouseover", (index, text) => {
  cy.get(themelocator.border).eq(index).trigger("mouseover");
  cy.wait(1000);
  cy.get(themelocator.popover).contains(text);
});

Cypress.Commands.add("colorMouseover", (index, text) => {
  let colorType =
    index == 0
      ? theme.locators._colorRingPrimary
      : theme.locators._colorRingBackground;
  cy.get(colorType).trigger("mouseover");
  cy.wait(2000);
  cy.get(themelocator.popover).contains(text);
  cy.get(colorType).click();
});

Cypress.Commands.add("validateColor", (type, text) => {
  // cy.get(theme.locators._colorInput(type)).click({ force: true });
  // cy.wait(1000);
  cy.xpath(theme.locators._colorInput(type)).should("have.value", text);
  cy.wait(1000);
});

Cypress.Commands.add("chooseColor", (index, color) => {
  cy.get(themelocator.colorPicker).eq(index).click({ force: true });
  cy.get(color).last().click();
  cy.wait(2000);
});
