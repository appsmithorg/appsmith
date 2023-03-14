const explorer = require("../../../../../locators/explorerlocators.json");

const widgetName = "radiogroupwidget";

describe("Radio Group Widget", () => {
  it("Drag & drop Radio group & Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{RadioGroup1.isDirty}}`);
  });

  it("Check isDirty meta property", function() {
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(".t--widget-radiogroupwidget .bp3-radio")
      .last()
      .click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultOptionValue
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "N");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });
});
