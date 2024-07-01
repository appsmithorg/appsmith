import * as _ from "../../../../support/Objects/ObjectsCore";
import {
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "../../../../../src/layoutSystems/common/utils/constants";

describe(
  "Validating use cases for Auto Dimension",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    before(() => {
      _.autoLayout.ConvertToAutoLayoutAndVerify(false);
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        100,
        20,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        5,
        10,
      );
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.INPUT_V2,
        100,
        75,
      );
    });

    it(`1. Validating row gap of ${ROW_GAP}px for desktop view`, () => {
      _.agHelper.GetWidgetByName("Input1").then((widget) => {
        const input1Bottom = widget.get(0).getBoundingClientRect().bottom;
        _.agHelper.GetWidgetByName("Input3").then((widget) => {
          const input3Top = widget.get(0).getBoundingClientRect().top;
          // Subtracting 4px to account for the bounding box border width
          expect(input3Top - input1Bottom - 4).to.be.equal(ROW_GAP);
        });
      });
    });

    it(`2. Validating row gap of ${MOBILE_ROW_GAP}px for mobile view (non-wrapped widgets)`, () => {
      _.agHelper.SetCanvasViewportWidth(375);
      _.agHelper.Sleep();
      _.agHelper.GetWidgetByName("Input1").then((widget) => {
        const input1Bottom = widget.get(0).getBoundingClientRect().bottom;
        _.agHelper.GetWidgetByName("Input3").then((widget) => {
          const input3Top = widget.get(0).getBoundingClientRect().top;
          // Subtracting 4px to account for the bounding box border width
          expect(input3Top - input1Bottom - 4).to.be.equal(MOBILE_ROW_GAP);
        });
      });
    });

    it(`3. Validating row gap of ${MOBILE_ROW_GAP}px for mobile view - (wrapped widgets)`, () => {
      _.agHelper.GetWidgetByName("Input2").then((widget) => {
        const input2Bottom = widget.get(0).getBoundingClientRect().bottom;
        _.agHelper.GetWidgetByName("Input1").then((widget) => {
          const input1Top = widget.get(0).getBoundingClientRect().top;
          // Subtracting 4px to account for the bounding box border width
          expect(input1Top - input2Bottom - 4).to.be.equal(MOBILE_ROW_GAP);
        });
      });
    });
  },
);
