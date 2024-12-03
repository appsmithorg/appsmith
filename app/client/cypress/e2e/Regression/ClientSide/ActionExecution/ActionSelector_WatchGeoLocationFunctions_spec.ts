import {
  agHelper,
  apiPage,
  appSettings,
  assertHelper,
  dataManager,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - WatchGeoLocation function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 200);
    });

    it("1. Verify watchPosition automatically updates appsmith.geolocation.currentPosition", () => {
      // Mock geolocation permissions
      cy.window().then((win) => {
        cy.stub(win.navigator.permissions, "query").resolves({
          state: "granted",
        });
      });

      // Mock geolocation with changing positions
      let watchCallback: ((position: GeolocationPosition) => void) | null =
        null;

      cy.window().then((win) => {
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success) => {
            watchCallback = success;
            // Initial position
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

      // Verify first position update
      cy.get(locators._textWidget)
        .first()
        .should("contain", "37.7749, -122.4194");

      // Simulate position change
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

      // Verify position update
      cy.get(locators._textWidget)
        .first()
        .should("contain", "40.7128")
        .and("contain", "-74.006");
    });

    it("2. Verify that calling getCurrentPosition when a geolocation watch is active throws an error.", () => {
      // Start watching position
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Watch geolocation");
      agHelper.ClickButton("Submit");

      // Try to call getCurrentPosition while watch is active
      propPane.SelectPlatformFunction("onClick", "Get geolocation");
      agHelper.ClickButton("Submit");

      // Verify error message
      agHelper.ValidateToastMessage("User denied Geolocation");

      // Clear the watch
      propPane.SelectPlatformFunction("onClick", "Stop watching geolocation");
      agHelper.ClickButton("Submit");

      // Now getCurrentPosition should work
      propPane.SelectPlatformFunction("onClick", "Get geolocation");
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(
        "A watchLocation is already active. Clear it before before starting a new one",
      ); // No error message
    });

    it("3. Verify that the error callback is executed when getCurrentPosition encounters an error", () => {
      // Mock geolocation with error
      cy.window().then((win) => {
        cy.stub(win.navigator.permissions, "query").resolves({
          state: "denied",
        });
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success, error) => {
            error({
              code: 1,
              message: "User denied Geolocation",
            });
            return 0;
          },
        );
      });

      // Set up watch position with error callback
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{appsmith.geolocation.watchPosition(
          () => showAlert('Success'),
          (error) => showAlert(error.message)
        )}}`,
        true,
        false,
      );

      // Trigger watch and verify error
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("User denied Geolocation");
    });

    it("4. Verify that getCurrentPosition correctly handles the options parameter for maximumAge, timeout, and enableHighAccuracy.", () => {
      // Mock geolocation with options verification
      cy.window().then((win) => {
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success, error, options) => {
            // Verify options are passed correctly
            expect(options).to.deep.equal({
              maximumAge: 1000,
              timeout: 5000,
              enableHighAccuracy: true,
            });

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

      // Set up watch position with options
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{appsmith.geolocation.watchPosition(
          () => showAlert('Success'),
          (error) => showAlert(error.message),
          {
            maximumAge: 1000,
            timeout: 5000,
            enableHighAccuracy: true
          }
        )}}`,
        true,
        false,
      );

      // Verify in edit mode
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success");

      // Verify in deploy mode
      deployMode.DeployApp();

      // Re-mock geolocation for deploy mode
      cy.window().then((win) => {
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success, error, options) => {
            expect(options).to.deep.equal({
              maximumAge: 1000,
              timeout: 5000,
              enableHighAccuracy: true,
            });

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

      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success");
      deployMode.NavigateBacktoEditor();
    });
  },
);
