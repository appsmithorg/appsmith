const dsl = require("../../../../../../fixtures/Listv2/simpleListWithTabsWidget.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

describe("List v2- Tabs Widget", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. change in the properties of the tabs widget should retain the default selected tab", () => {
    cy.openPropertyPaneByWidgetName("Tabs1", "tabswidget");

    // Check if Tab1 selected
    cy.get(".t--page-switch-tab.is-active").contains("Tab 1");

    // Disable Scroll Content
    cy.togglebarDisable(commonlocators.scrollView);
    // Check if disabled
    cy.get(commonlocators.scrollView)
      .parent()
      .should("have.class", "unchecked");
    // Check if Tab 1 still selected
    cy.get(".t--page-switch-tab.is-active").contains("Tab 1");

    // Enable Scroll Content
    cy.togglebar(commonlocators.scrollView);
    // Check if enabled
    cy.get(commonlocators.scrollView).parent().should("have.class", "checked");
    // Check if Tab 1 still selected
    cy.get(".t--page-switch-tab.is-active").contains("Tab 1");
  });
});
