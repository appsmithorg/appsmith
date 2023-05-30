import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    _.autoLayout.convertToAutoLayoutAndVerify(false);
  });

  beforeEach(() => {
    // Cleanup the canvas before each test
    _.agHelper.SelectAllWidgets();
    _.agHelper.PressDelete();
    _.agHelper.SetCanvasViewportWidth(808);
  });

  ["DESKTOP", "MOBILE"].forEach((viewport) => {
    it(`1. [${viewport}] Verify if Auto dimension works for widgets in the MainCanvas`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.autoLayout.DropButtonAndTestForAutoDimension(100, 30);
      _.autoLayout.DropTextAndTestForAutoDimension(100, 60);
    });

    it(`2. [${viewport}] Verify if Auto dimension works for widgets in a Container`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.CONTAINER,
        100,
        30,
      );

      _.agHelper
        .GetWidgetByName("Container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          // dropButtonAndTest(100, 25, dropTargetClass);
          _.autoLayout.DropButtonAndTestForAutoDimension(
            100,
            30,
            dropTargetClass,
          );
          // y = main canvas padding (8) + button widget height (40)
          _.autoLayout.DropTextAndTestForAutoDimension(
            100,
            48,
            dropTargetClass,
          );
        });
    });

    it(`3. [${viewport}] Verify if Auto dimension works for widgets in a List`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.LIST_V2,
        100,
        30,
      );

      // Delete existing widgets within list
      _.agHelper.SelectAllWidgets(_.locators._widgetByName("Container1"));
      _.agHelper.PressDelete();

      _.agHelper
        .GetWidgetByName("Container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          _.autoLayout.DropButtonAndTestForAutoDimension(
            100,
            25,
            dropTargetClass,
          );
          // y = main canvas padding (8) + button widget height (40)
          _.autoLayout.DropTextAndTestForAutoDimension(
            100,
            48,
            dropTargetClass,
          );
        });
    });
  });
});
