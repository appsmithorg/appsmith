import {
  agHelper,
  locators,
  entityExplorer,
  autoLayout,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
  });

  beforeEach(() => {
    // Cleanup the canvas before each test
    agHelper.SelectAllWidgets();
    agHelper.PressDelete();
    agHelper.SetCanvasViewportWidth(808);
  });

  ["DESKTOP", "MOBILE"].forEach((viewport) => {
    it(`1. [${viewport}] Verify if Auto dimension works for widgets in the MainCanvas`, () => {
      if (viewport === "MOBILE") {
        agHelper.SetCanvasViewportWidth(375);
      }
      autoLayout.DropButtonAndTestForAutoDimension(100, 100);
      autoLayout.DropTextAndTestForAutoDimension(100, 200);
    });

    it(`2. [${viewport}] Verify if Auto dimension works for widgets in a Container`, () => {
      if (viewport === "MOBILE") {
        agHelper.SetCanvasViewportWidth(375);
      }
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CONTAINER, 100, 30);
      autoLayout.DropButtonAndTestForAutoDimension(
        100,
        30,
        draggableWidgets.CONTAINER,
      );
      // y = main canvas padding (8) + button widget height (40)
      autoLayout.DropTextAndTestForAutoDimension(
        100,
        48,
        draggableWidgets.CONTAINER,
      );
    });

    it(`3. [${viewport}] Verify if Auto dimension works for widgets in a List`, () => {
      if (viewport === "MOBILE") {
        agHelper.SetCanvasViewportWidth(375);
      }
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.LIST_V2, 100, 30);

      // Delete existing widgets within list
      agHelper.SelectAllWidgets(locators._widgetByName("Container1"));
      agHelper.PressDelete();
      agHelper.Sleep(2000);
      autoLayout.DropButtonAndTestForAutoDimension(
        100,
        25,
        draggableWidgets.CONTAINER,
      );
      // y = main canvas padding (8) + button widget height (40)
      autoLayout.DropTextAndTestForAutoDimension(
        100,
        50,
        draggableWidgets.CONTAINER,
      );
    });
  });
});
