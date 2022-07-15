const LayoutPage = require("../../../../locators/Layout.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tabsWidgetReset.json");

describe("Tabs widget resetting", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1.Change the tab in the Tabs widget", function() {
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 3")
      .click({ force: true })
      .should("be.visible");
  });

  it("2.Reset the Tabs widget using the Button widget", function() {
    cy.get(widgetsPage.buttonWidget)
      .contains("Submit")
      .click({
        force: true,
      });
  });

  it("3.Check the Tabs widget default value after the reset", function() {
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 1")
      .should("not.have.class", "is-selected");
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 2")
      .should("have.class", "is-selected");

    cy.get(widgetsPage.textWidget).contains("Tab 2");

    cy.openPropertyPane("tabswidget");
    cy.get(".t--property-control-defaulttab .CodeMirror .CodeMirror-code")
      .first()
      .should("have.text", "Tab 2");
  });
});
