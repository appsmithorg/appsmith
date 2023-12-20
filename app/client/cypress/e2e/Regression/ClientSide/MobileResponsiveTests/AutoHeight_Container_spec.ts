import { WIDGET_PADDING } from "../../../../../src/constants/WidgetConstants";
import { MOBILE_ROW_GAP } from "../../../../../src/layoutSystems/common/utils/constants";
import {
  agHelper,
  autoLayout,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { getWidgetSelector } from "../../../../locators/WidgetLocators";

let childHeight = 0;
let containerHeight = 0;
const containerPadding = 16;
let inputHeight = 0;
describe(
  "Validate auto height for container widget on auto layout canvas",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    it("1. parent height should update on adding or deleting child widgets", () => {
      /**
       * Convert app to AutoLayout
       */
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      agHelper.Sleep();
      /**
       * Add widget.
       */
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.CONTAINER,
        100,
        200,
      );
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((height) => {
          cy.log("container height", height);
          containerHeight = parseInt(height?.split("px")[0]);
        });

      // add an input widget to the container.
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        100,
        10,
        "containerwidget",
      );

      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.INPUT_V2))
        .then((height) => {
          childHeight += parseInt(height?.split("px")[0]);
          inputHeight = parseInt(height?.split("px")[0]);
        });
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          expect(updatedHeight).to.equal(
            childHeight + containerPadding + WIDGET_PADDING,
          );
          containerHeight = updatedHeight;
        });

      // Add a child Table widget to the container.
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.TABLE,
        100,
        60,
        "containerwidget",
      );
      agHelper.Sleep();
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TABLE))
        .then((height) => {
          childHeight += parseInt(height?.split("px")[0]);
        });
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          containerHeight = updatedHeight;
        });

      // Delete table widget
      propPane.DeleteWidgetFromPropertyPane("Table1");
      agHelper.Sleep();
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.lessThan(containerHeight);
          containerHeight = updatedHeight;
        });
    });

    it("2. container widget should update height upon flex wrap on mobile viewport", () => {
      // add an input widget to the container.
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        50,
        40,
        "containerwidget",
      );
      agHelper.Sleep();
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.equal(containerHeight);
        });

      // Switch to mobile viewport
      agHelper.SetCanvasViewportWidth(400);
      agHelper.Sleep(2000);

      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.CONTAINER))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          expect(updatedHeight).to.be.greaterThan(containerHeight);
          expect(updatedHeight).to.equal(
            containerHeight + inputHeight + WIDGET_PADDING + MOBILE_ROW_GAP,
          );
        });
    });
  },
);
