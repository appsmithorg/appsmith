const widgetsPage = require("../../../../../locators/Widgets.json");

const widgetName = "currencyinputwidget";

describe("Currency Widget showStepArrows Functionality - ", function() {
  it("1. Validate that For new currency input widgets being dragged, the value for showStepArrows should be set to false", () => {
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 400 });
    cy.openPropertyPane(widgetName);

    cy.get(widgetsPage.showStepArrowsToggleCheckBox).should("not.be.checked");

    cy.get(widgetsPage.inputStepArrows).should("not.exist"); // This is the step arrows
  });

  it("2. Validate that currency input widget, stepArrows should be visible when showStepArrows is set to true", () => {
    // Enable showStepArrows to true
    cy.togglebar(widgetsPage.showStepArrowsToggleCheckBox);

    cy.get(widgetsPage.inputStepArrows).should("exist"); // step arrows should be visible
  });

  it("3. Toggle test case to validate that currency input widget, stepArrows should be hidden when toggle value is false", () => {
    // click on the Js
    cy.get(widgetsPage.toggleShowStepArrows).click({ force: true });

    // Add showStepArrows action and value as false
    cy.testJsontext("showsteparrows", `{{false}}`);

    cy.get(widgetsPage.inputStepArrows).should("not.exist"); // step arrows should not be visible
  });

  it("4. Toggle test case to validate that currency input widget, stepArrows should be visible when toggle value is true", () => {
    // Add showStepArrows action and value as true
    cy.testJsontext("showsteparrows", `{{true}}`);

    cy.get(widgetsPage.inputStepArrows).should("exist"); // step arrows should be visible
  });
});
