import { WIDGET_PADDING } from "../../../../../src/constants/WidgetConstants";
import {
  MOBILE_ROW_GAP,
  ROW_GAP,
} from "../../../../../src/utils/autoLayout/constants";
import {
  agHelper,
  autoLayout,
  draggableWidgets,
  entityExplorer,
  propPane,
  tabs,
} from "../../../../support/Objects/ObjectsCore";
import { getWidgetSelector } from "../../../../locators/WidgetLocators";

let childHeight = 0;
let containerHeight = 0;
let inputHeight = 0;
const tabsMinHeight = 300 - WIDGET_PADDING;
let dropTargetClass = "";
describe("validate auto height for tabs widget on auto layout canvas", () => {
  it("tabs widget should maintain a minHeight of 30 rows", () => {
    /**
     * Convert app to AutoLayout
     */
    autoLayout.ConvertToAutoLayoutAndVerify(false);
    agHelper.Sleep();

    /**
     * Add Tabs widget.
     */
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TAB, 100, 200);
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((height) => {
        containerHeight = parseInt(height?.split("px")[0]);
        // TABS widget has a minHeight of 30 rows.
        expect(containerHeight).to.equal(tabsMinHeight);
      });

    agHelper.GetDropTargetId("Tabs1").then((id) => {
      dropTargetClass = `.drop-target-${id?.split("_")[1]}`;
      // add an input widget to the tabs widget.
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.INPUT_V2,
        100,
        100,
        dropTargetClass,
      );

      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.INPUT_V2))
        .then((height) => {
          childHeight += parseInt(height?.split("px")[0]);
          inputHeight = parseInt(height?.split("px")[0]);
          expect(containerHeight).to.be.greaterThan(childHeight);
        });
      agHelper
        .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
        .then((newHeight) => {
          const updatedHeight = parseInt(newHeight?.split("px")[0]);
          // Widget maintains a minHeight of 30 rows.
          expect(updatedHeight).to.equal(containerHeight);
          containerHeight = updatedHeight;
        });
    });
  });

  it("should update height on adding child widgets", () => {
    // Add a child Table widget to the container.
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.TABLE,
      300,
      150,
      dropTargetClass,
    );
    agHelper.Sleep();
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TABLE))
      .then((height) => {
        childHeight += parseInt(height?.split("px")[0]);
      });
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on toggling visibility of tabs header", () => {
    // Hide tabs header.
    tabs.toggleShowTabHeader(false);
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(containerHeight - 40); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Show tabs header.
    tabs.toggleShowTabHeader();
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(containerHeight + 40); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });
  });

  it("should update height on switching tabs", () => {
    // Switch to tab 2.
    tabs.selectTab("tab2");

    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Switch to tab 1.
    tabs.selectTab("tab1");

    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on flex wrap at mobile viewport", () => {
    // add an input widget to the tabs widget, in the first row.
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.INPUT_V2,
      30,
      70,
      dropTargetClass,
    );

    // Switch to mobile viewport
    agHelper.SetCanvasViewportWidth(400);
    agHelper.Sleep(2000);

    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        // Flex wrap would lead to creation of a new row.
        const numOfRowsAdded = 1;
        // Row gap is 8px on mobile viewport (< row gap on desktop).
        const rowGapDiff = ROW_GAP - MOBILE_ROW_GAP;
        const originalRows = 1;
        const totalRowGapDiff = rowGapDiff * originalRows;
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        expect(updatedHeight).to.equal(
          containerHeight +
            inputHeight +
            WIDGET_PADDING +
            numOfRowsAdded * MOBILE_ROW_GAP -
            totalRowGapDiff,
        );
      });
  });

  it("should update height on switching tabs at mobile viewport", () => {
    // Switch to tab 2.
    tabs.selectTab("tab2");

    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        // Tabs header height is 40px (4 rows).
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });

    // Switch to tab 1.
    tabs.selectTab("tab1");

    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.greaterThan(containerHeight);
        containerHeight = updatedHeight;
      });
  });

  it("should update height on deleting child widgets", () => {
    // Switch to desktop viewport
    agHelper.SetCanvasViewportWidth(1024);
    agHelper.Sleep(2000);

    // Delete table widget
    propPane.DeleteWidgetFromPropertyPane("Table1");
    agHelper.Sleep();
    agHelper
      .GetWidgetCSSHeight(getWidgetSelector(draggableWidgets.TAB))
      .then((newHeight) => {
        const updatedHeight = parseInt(newHeight?.split("px")[0]);
        expect(updatedHeight).to.be.lessThan(containerHeight);
        expect(updatedHeight).to.equal(tabsMinHeight); // minHeight of 30 rows.
        containerHeight = updatedHeight;
      });
  });
});
