import { entityExplorer } from "../../../../../support/Objects/ObjectsCore";
import { draggableWidgets } from "../../../../../support/Objects/ObjectsCore";

const widgetName = "audiorecorderwidget";

describe(
  "AudioRecorder Widget",
  { tags: ["@tag.Widget", "@tag.Audio"] },
  () => {
    it("Drag & drop AudioRecorder and Text widgets", () => {
      entityExplorer.DragNDropWidget(widgetName, 300, 300);
      cy.get(`.t--widget-${widgetName}`).should("exist");
      entityExplorer.DragNDropWidget(draggableWidgets.TEXT, 300, 500);
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
      cy.get(`.t--widget-${widgetName} button`).first().click();
      cy.get(`.t--widget-${widgetName} .status`)
        .should("have.text", "Press to start recording")
        .should("exist");
      // Start recording and recorder for 3 seconds
      cy.get(`.t--widget-${widgetName} button`).first().click();
      cy.wait(3000);
      // Stop recording
      cy.get(`.t--widget-${widgetName} button span.bp3-icon-symbol-square`)
        .first()
        .click();
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
    });
  },
);
