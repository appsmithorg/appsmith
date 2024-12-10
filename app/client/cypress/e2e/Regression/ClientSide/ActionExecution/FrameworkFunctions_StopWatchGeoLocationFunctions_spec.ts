import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - StopWatchGeoLocation function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 200);
    });

    it("1. Verify that calling geolocation.clearWatch() when no geolocation watch is active throws an error.", () => {
      // Mock geolocation permissions
      cy.window().then((win) => {
        cy.stub(win.navigator.permissions, "query").resolves({
          state: "granted",
        });
      });

      // Try to clear watch without active watch
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Stop watching geolocation");
      agHelper.ClickButton("Submit");

      // Verify error message with wait
      agHelper.ValidateToastMessage("No location watch active", 0, 1);

      // Verify same behavior in deploy mode
      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("No location watch active", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("2. Verify that geolocation.clearWatch() allows clearing the current watch, and a new geolocation watch can be started immediately after.", () => {
      // Mock geolocation with changing positions
      let watchCallback: ((position: GeolocationPosition) => void) | null =
        null;

      cy.window().then((win) => {
        cy.stub(win.navigator.permissions, "query").resolves({
          state: "granted",
        });
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success) => {
            watchCallback = success;
            success({
              coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            });
            return 0;
          },
        );
      });

      // Set up text widget to display coordinates
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{appsmith.geolocation.currentPosition.coords.latitude}}, {{appsmith.geolocation.currentPosition.coords.longitude}}",
      );

      // Start watching position
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Watch geolocation");
      agHelper.ClickButton("Submit");

      // Verify initial position
      cy.get(locators._textWidget)
        .first()
        .should("contain", "37.7749, -122.4194");

      // Clear watch
      propPane.SelectPlatformFunction("onClick", "Stop watching geolocation");
      agHelper.ClickButton("Submit");

      // Start new watch
      propPane.SelectPlatformFunction("onClick", "Watch geolocation");
      agHelper.ClickButton("Submit");

      // Verify new watch works
      cy.window().then(() => {
        watchCallback?.({
          coords: {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      });

      cy.get(locators._textWidget)
        .first()
        .should("contain", "40.7128, -74.006");
    });
  },
);
