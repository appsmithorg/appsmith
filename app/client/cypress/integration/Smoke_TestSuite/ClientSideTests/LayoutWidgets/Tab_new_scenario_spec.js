const commonlocators = require("../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../locators/Layout.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tabsWithWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tab Widget Functionality Test", function() {
    cy.openPropertyPane("tabswidget");
    cy.widgetText("tab", Layoutpage.tabWidget, Layoutpage.tabInput);
    cy.AddActionWithModal();
    cy.get(".t--widget-buttonwidget:contains('Confirm')").click({
      force: true,
    });
    cy.PublishtheApp();
    cy.get(".t--widget-buttonwidget").should("be.visible");
    cy.get(".t--widget-textwidget").should("be.visible");
    cy.get(".t--widget-datepickerwidget2").should("be.visible");
    cy.get(".t--tab-Tab")
      .contains("Tab 2")
      .click({ force: true });
    cy.get(".t--widget-checkboxwidget").should("be.visible");
    cy.get(".t--widget-radiogroupwidget").should("be.visible");
    cy.get(".t--widget-buttonwidget")
      .contains("Confirm")
      .click({ force: true });
  });
});

afterEach(() => {
  // put your clean up code if any
});
