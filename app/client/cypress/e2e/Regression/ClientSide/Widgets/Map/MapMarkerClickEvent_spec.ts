/// <reference types="Cypress" />
import {
  agHelper,
  entityExplorer,
  draggableWidgets,
  jsEditor,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Map Widget - Marker Click Event",
  { tags: ["@tag.Widget", "@tag.Map"] },
  function () {
    it("1. Verify map marker click event triggers only once", () => {
      // Add a map widget
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAP);

      // Add a JS Object to track marker clicks
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      jsEditor.CreateJSObject(
        `export default {
        clickCount: 0,
        incrementClickCount: () => {
          this.clickCount += 1;
          return this.clickCount;
        },
        resetClickCount: () => {
          this.clickCount = 0;
        }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );
      jsEditor.RenameJSObjFromExplorer("JSObject1", "MarkerTracker");

      // Configure map with a marker
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
      propPane.EnterJSContext(
        "Initial location",
        JSON.stringify({
          lat: 37.7749,
          long: -122.4194,
          title: "San Francisco",
        }),
      );

      propPane.TypeTextIntoField(
        "Default Markers",
        JSON.stringify([
          { lat: 37.7749, long: -122.4194, title: "Test Marker" },
        ]),
      );

      // Add onMarkerClick event to increment counter
      propPane.EnterJSContext(
        "onMarkerClick",
        "{{MarkerTracker.incrementClickCount()}}",
      );

      // Add a text widget to display click count
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 200);
      propPane.EnterJSContext("Text", "{{MarkerTracker.clickCount}}");

      // Click on the marker
      agHelper.GetNClick('div[aria-label="Test Marker"]');

      // Verify the click count is exactly 1
      agHelper.GetNAssertElementText(locators._textWidget, "1", "contain.text");

      // Click again to ensure it increments properly
      agHelper.GetNClick('div[aria-label="Test Marker"]');
      agHelper.GetNAssertElementText(locators._textWidget, "2", "contain.text");
    });
  },
);
