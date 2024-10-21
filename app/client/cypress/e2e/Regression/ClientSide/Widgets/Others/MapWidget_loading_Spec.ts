/// <reference types="Cypress" />
import {
  agHelper,
  entityExplorer,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Map chart Widget",
  { tags: ["@tag.Widget", "@tag.Maps", "@tag.Binding"] },
  function () {
    it("1.Drag two Map Widget and Verify the Map Widget is loading", () => {
      //Add map and verify
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAPCHART, 200, 200);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAPCHART, 600, 200);
      agHelper.RefreshPage();
      agHelper.AssertElementLength(
        ".t--draggable-mapchartwidget svg text:contains('Global Population')",
        2,
      );
    });
  },
);
