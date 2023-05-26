import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    _.propPane.ConvertToAutoLayout();
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
      _.widgets.DropButtonAndTestForAutoDimension(100, 30);
      _.widgets.DropTextAndTestForAutoDimension(100, 60);
    });

    it(`2. [${viewport}] Verify if Auto dimension works for widgets in a Container`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify("containerwidget", 100, 30);

      cy.get(".t--widget-container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          // dropButtonAndTest(100, 25, dropTargetClass);
          _.widgets.DropButtonAndTestForAutoDimension(100, 30, dropTargetClass);
          // y = main canvas padding (8) + button widget height (40)
          _.widgets.DropTextAndTestForAutoDimension(100, 48, dropTargetClass);
        });
    });

    it(`3. [${viewport}] Verify if Auto dimension works for widgets in a List`, () => {
      if (viewport === "MOBILE") {
        _.agHelper.SetCanvasViewportWidth(375);
      }
      _.entityExplorer.DragDropWidgetNVerify("listwidgetv2", 100, 30);

      // Delete existing widgets within list
      _.agHelper.SelectAllWidgets(".t--widget-container1");
      _.agHelper.PressDelete();

      cy.get(".t--widget-container1")
        .invoke("attr", "id")
        .then((id) => {
          const dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
          _.widgets.DropButtonAndTestForAutoDimension(100, 25, dropTargetClass);
          // y = main canvas padding (8) + button widget height (40)
          _.widgets.DropTextAndTestForAutoDimension(100, 48, dropTargetClass);
        });
    });
  });
});
