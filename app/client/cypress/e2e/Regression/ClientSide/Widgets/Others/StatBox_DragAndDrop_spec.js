import {
  agHelper,
  draggableWidgets,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Statbox Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Statbox"] },
  function () {
    before(() => {
      agHelper.AddDsl("dynamicHeightStatboxdsl");
    });

    it("1. Verify Statbox can be placed inside another widget", () => {
      // placing statbox widget inside container widget
      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.STATBOX,
        300,
        100,
        draggableWidgets.CONTAINER,
      );
      PageLeftPane.switchSegment(PagePaneSegment.Explorer);
      PageLeftPane.assertPresence("Statbox1");
      PageLeftPane.expandCollapseItem("Container1");
      PageLeftPane.assertPresence("Statbox2");
    });
  },
);
