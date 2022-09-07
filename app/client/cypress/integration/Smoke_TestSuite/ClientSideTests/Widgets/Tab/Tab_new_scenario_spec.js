const Layoutpage = require("../../../../../locators/Layout.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tabsWithWidgetDsl.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tab Widget Functionality Test with Modal on change of selected tab", function() {
    cy.openPropertyPane("tabswidget");
    cy.widgetText("tab", Layoutpage.tabWidget, Layoutpage.tabInput);
    cy.AddActionWithModal();
    cy.get(".t--widget-buttonwidget:contains('Confirm')").click({
      force: true,
    });
  });

  it("Publih the app and validate the widgets displayed under each tab", function() {
    cy.PublishtheApp();
    cy.get(publish.buttonWidget).should("be.visible");
    cy.get(publish.textWidget).should("be.visible");
    cy.get(publish.datePickerNew).should("be.visible");
    cy.wait(3000);
    cy.get(publish.tab)
      .contains("Tab 2")
      .click({ force: true });
    cy.get(publish.checkboxWidget).should("be.visible");
    cy.get(publish.radioWidget).should("be.visible");

    cy.get(publish.buttonWidget)
      .contains("Confirm")
      .click({
        force: true,
      });
  });
});
afterEach(() => {
  // put your clean up code if any
});
