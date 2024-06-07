import {
  agHelper,
  draggableWidgets,
  jsEditor,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import Canvas from "../../../../support/Pages/Canvas";
import EditorNavigation, {
  EditorViewMode,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("Canvas view mode", { tags: ["@tag.IDE"] }, () => {
  const JS_OBJECT_BODY = `export default {
    testFunction: () => {
      console.log("hi");
    },
  }`;
  const shortKey = Cypress.platform === "darwin" ? "\u2318" : "Ctrl +";

  it("1. Canvas view mode functionalities", () => {
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 200 });

    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    EditorNavigation.SwitchScreenMode(EditorViewMode.SplitScreen);

    Canvas.hoverOnWidget("Input1");
    // check for tooltip helper text
    cy.assertTooltipPresence(
      '[role="tooltip"]',
      Cypress.env("MESSAGES").CANVAS_VIEW_MODE_TOOLTIP(shortKey),
    );
    // check for widget name element
    cy.get(`div[data-testid="t--settings-controls-positioned-wrapper"]`)
      .should("be.visible")
      .contains("Input1");

    // check widget intraction
    agHelper.ClearNType(
      locators._widgetInDeployed(draggableWidgets.INPUT_V2) + " input",
      "test data",
    );

    // assert js pane existance
    PageLeftPane.assertSelectedSegment(PagePaneSegment.JS);

    // cmd click to show property pane
    Canvas.commandClickWidget("Input1");

    // check for property pane visibility
    cy.get(".t--property-pane-sidebar").should("be.visible");
  });
});
