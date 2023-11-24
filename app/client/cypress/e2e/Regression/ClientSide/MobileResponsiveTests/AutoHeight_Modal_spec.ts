import { WIDGET_PADDING } from "../../../../../src/constants/WidgetConstants";
import {
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "../../../../../src/layoutSystems/common/utils/constants";
import {
  agHelper,
  autoLayout,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import {
  getWidgetSelector,
  modalWidgetSelector,
} from "../../../../locators/WidgetLocators";

let childHeight = 0;
let containerHeight = 0;
let inputHeight = 0;
let iconHeight = 0;
let dropTargetClass = "";
describe(
  "validate auto height for modal widget on auto layout canvas",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    it("1. modal widget height should update on adding or deleting child widgets", () => {
      /**
       * Convert app to AutoLayout
       */
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      agHelper.Sleep();
      /**
       * Add widget.
       */
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MODAL, 100, 200);
      agHelper.Sleep();
      agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((height) => {
        containerHeight = parseInt(height?.split("px")[0]);
      });

      agHelper.GetModalDropTargetId().then((id) => {
        dropTargetClass = `.drop-target-${id}`;
        // add an input widget to the container.
        entityExplorer.DragDropWidgetNVerify(
          draggableWidgets.INPUT_V2,
          250,
          10,
          "",
          dropTargetClass,
        );

        agHelper
          .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.INPUT_V2))
          .then((height) => {
            childHeight += parseInt(height?.split("px")[0]);
            inputHeight = parseInt(height?.split("px")[0]);
          });
        agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          expect(updatedHeight).to.equal(
            childHeight + containerHeight + WIDGET_PADDING + ROW_GAP,
          );
          containerHeight = updatedHeight;
        });

        // Add a child Table widget to the container.
        entityExplorer.DragDropWidgetNVerify(
          draggableWidgets.TABLE,
          100,
          76,
          "",
          dropTargetClass,
        );
        agHelper.Sleep();
        agHelper
          .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TABLE))
          .then((height) => {
            childHeight += parseInt(height?.split("px")[0]);
          });
        agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          containerHeight = updatedHeight;
        });

        // Delete table widget
        propPane.DeleteWidgetFromPropertyPane("Table1");
        agHelper.Sleep();
        agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.lessThan(containerHeight);
          containerHeight = updatedHeight;
        });
      });
    });

    it("2. modal widget should update height upon flex wrap on mobile viewport", () => {
      // add an input widget to the container.
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        50,
        40,
        "",
        dropTargetClass,
      );
      agHelper.Sleep();
      agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.equal(containerHeight);
      });

      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.ICONBUTTON))
        .then((height) => {
          iconHeight = parseInt(height?.split("px")[0]);
        });

      // Switch to mobile viewport
      agHelper.SetCanvasViewportWidth(400);
      agHelper.Sleep(2000);

      agHelper.GetWidgetCSSHeight(modalWidgetSelector).then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        // Flex wrap would lead to creation of a new row.
        const numOfRowsAdded = 2;
        // Row gap is 8px on mobile viewport (< row gap on desktop).
        const rowGapDiff = ROW_GAP - MOBILE_ROW_GAP;
        const originalRows = 2;
        const totalRowGapDiff = rowGapDiff * originalRows;
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        expect(updatedHeight).to.equal(
          containerHeight +
            inputHeight +
            iconHeight +
            WIDGET_PADDING * 2 +
            numOfRowsAdded * MOBILE_ROW_GAP -
            totalRowGapDiff,
        );
      });
    });
  },
);
