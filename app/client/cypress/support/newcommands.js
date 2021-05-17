/// <reference types="Cypress" />
/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cypress-file-upload");

const loginPage = require("../locators/LoginPage.json");
const homePage = require("../locators/HomePage.json");
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const commonlocators = require("../locators/commonlocators.json");
const queryEditor = require("../locators/QueryEditor.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
const ApiEditor = require("../locators/ApiEditor.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const explorer = require("../locators/explorerlocators.json");
const datasource = require("../locators/DatasourcesEditor.json");

let pageidcopy = " ";

Cypress.Commands.add("SearchEntityandOpen", (apiname1) => {
  cy.get(commonlocators.entityExplorersearch).should("be.visible");
  cy.get(commonlocators.entityExplorersearch)
    .clear()
    .type(apiname1);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(
    commonlocators.entitySearchResult.concat(apiname1).concat("')"),
  ).should("be.visible");
  cy.get(commonlocators.entitySearchResult.concat(apiname1).concat("')"))
    .last()
    .click({ force: true });
});

Cypress.Commands.add("ResponseStatusCheck", (statusCode) => {
  cy.xpath(apiwidget.responseStatus).should("be.visible");
  cy.xpath(apiwidget.responseStatus).contains(statusCode);
});
