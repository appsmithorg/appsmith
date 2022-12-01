const explorer = require("../../../../../locators/explorerlocators.json");

const widgetName = "audiorecorderwidget";

describe("AudioRecorder Widget", () => {
  it("Drag & drop AudioRecorder and Text widgets", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{AudioRecorder1.isDirty}}`,
    );
  });

  it("Check isDirty meta property", () => {
    // Check if isDirty is false for the first time
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(`.t--widget-${widgetName} button`)
      .first()
      .click();
    cy.get(`.t--widget-${widgetName} .status`)
      .should("have.text", "Press to start recording")
      .should("exist");
    // Start recording and recorder for 3 seconds
    cy.get(`.t--widget-${widgetName} button`)
      .first()
      .click();
    cy.wait(3000);
    // Stop recording
    cy.get(`.t--widget-${widgetName} button span.bp3-icon-symbol-square`)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
  });
});
