const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "selectwidget";

describe("Select widget", () => {
  it("1. DragDrop Select/Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Select1.isDirty}}`);
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(
      `.t--widget-${widgetName} .bp3-popover-target > div > .bp3-button`,
    ).click();
    cy.get(`.bp3-popover-content ul.bp3-menu li`)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultOptionValue property
    cy.updateCodeInput(".t--property-control-defaultvalue", "RED");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });
});
