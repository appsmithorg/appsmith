const dsl = require("../../../../fixtures/modalOnTableFilterPaneDsl.json");
const widgets = require("../../../../locators/Widgets.json");

describe("Modal Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Close the opened filter pane of the table", () => {
    const buttonSelector = widgets.buttonWidget;
    const tableFilterPaneSelector = widgets.tableFilterPaneToggle;
    const tableFilterRowSelector = widgets.tableFilterRow;
    const modalSelector = widgets.modalWidget;

    // Open the filter pane of table
    cy.get(tableFilterPaneSelector).click();
    // Should open the filter pane
    cy.get(tableFilterRowSelector).should("exist");
    // Open the modal
    cy.get(buttonSelector).click();
    // Should pop up the modal
    cy.get(modalSelector).should("exist");
    // Should close the open filter pane of the table
    cy.get(tableFilterRowSelector).should("not.exist");
  });
});
