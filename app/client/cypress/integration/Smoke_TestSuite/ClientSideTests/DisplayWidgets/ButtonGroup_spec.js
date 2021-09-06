const explorer = require("../../../../locators/explorerlocators.json");

describe("Button Group Widget Functionality", function() {
  it("Add new Button Group", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("buttongroupwidget", { x: 300, y: 300 });
    cy.get(".t--buttongroup-widget").should("exist");
  });

  it("Open Existing Button Group from created Widgets list", () => {
    cy.get(".t--close-widgets-sidebar").click({
      multiple: true,
    });
    cy.get(
      ".bp3-icon-caret-right ~ .t--entity-name:contains(ButtonGroup1)",
    ).click({
      multiple: true,
    });
  });
});
