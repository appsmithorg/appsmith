const LayoutPage = require("../../../../locators/Layout.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tabsWidgetReset.json");

describe("Tabs widget resetting", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1.Reset the Tabs widget With the default value.", function() {
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 3")
      .click({ force: true })
      .should("be.visible");

    cy.get(widgetsPage.buttonWidget)
      .contains("Submit")
      .click({
        force: true,
      });

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

  it("2.Reset the Tabs widget Without the default value.", function() {
    cy.testJsontext("defaulttab", "");
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 3")
      .click({ force: true })
      .should("be.visible");
    cy.get(widgetsPage.buttonWidget)
      .contains("Submit")
      .click({
        force: true,
      });
    cy.get(LayoutPage.tabWidget)
      .contains("Tab 1")
      .should("have.class", "is-selected");
  });
});
