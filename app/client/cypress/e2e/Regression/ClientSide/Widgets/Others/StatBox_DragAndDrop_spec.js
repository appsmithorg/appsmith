import {
  agHelper,
  draggableWidgets,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

describe("Statbox Widget Functionality", function () {
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
    entityExplorer.NavigateToSwitcher("Explorer");
    entityExplorer.AssertEntityPresenceInExplorer("Statbox1");
    entityExplorer.ExpandCollapseEntity("Container1");
    entityExplorer.AssertEntityPresenceInExplorer("Statbox2");
  });
});
