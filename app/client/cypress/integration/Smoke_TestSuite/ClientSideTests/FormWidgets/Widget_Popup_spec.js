const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/widgetPopupDsl.json");
const data = require("../../../../fixtures/example.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Verify dropdown width of Select and menu button", function() {
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .invoke("outerWidth")
      .should("eq", 208.9375);
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(".select-popover-wrapper")
      .invoke("outerWidth")
      .should("eq", 208.9375);

    cy.get(formWidgetsPage.menuButtonWidget)
      .find(widgetLocators.menuButton)
      .invoke("outerWidth")
      .should("eq", 208.9375);
    cy.get(formWidgetsPage.menuButtonWidget)
      .find(widgetLocators.menuButton)
      .click({ force: true });
    cy.get(".menu-button-popover").invoke("outerWidth");
  });
});
