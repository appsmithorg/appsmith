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
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

declare global {
  interface AUTWindow {
    appsmith: {
      geolocation: {
        currentPosition: GeolocationPosition;
      };
    };
  }
}

describe(
  "To verify action selector - WatchGeoLocation function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 200);
    });

    it("1. Verify that getCurrentPosition successfully retrieves the current position and automatically updates appsmith.geolocation.currentPosition.coords", () => {
      // Mock geolocation with a sample position
      cy.window().then((win) => {
        cy.stub(win.navigator.geolocation, "watchPosition").callsFake(
          (success) => {
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

      // Add a Text widget to display the coordinates
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      
      // First set a default text while waiting for geolocation
      propPane.UpdatePropertyFieldValue(
        "Text",
        "Waiting for location...",
      );

      // Set up watchPosition on button click
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Watch geolocation");
      agHelper.ClickButton("Submit");

      // Wait for geolocation data to be available
      cy.window().should((win: any) => {
        expect(win.appsmith.geolocation.currentPosition).to.not.be.undefined;
      });

      // Update the text binding after confirming geolocation is available
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{appsmith.geolocation.currentPosition.coords.latitude}}, {{appsmith.geolocation.currentPosition.coords.longitude}}",
      );

      // Verify the coordinates are displayed correctly
      cy.get(locators._textWidget)
        .first()
        .should("contain", "37.7749")
        .and("contain", "-122.4194");
    });


    // it("2. Verify that calling getCurrentPosition when a geolocation watch is active throws an error.", () => {
      
    // });

    // it("3. Verify that the error callback is executed when getCurrentPosition encounters an error (e.g., location services disabled or permission denied).", () => {
     
    // });

    // it("4. Verify that getCurrentPosition correctly handles the options parameter for maximumAge, timeout, and enableHighAccuracy.", () => {
      
    // });
  },
);
