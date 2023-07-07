import {
  entityExplorer,
  locators,
  agHelper,
  propPane,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for List widgets", function () {
    agHelper.AddDsl("ResizeListDsl");

    entityExplorer.SelectEntityByName("Tab 1", "Tabs1");
    entityExplorer.SelectEntityByName("List1", "Tab 1");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST_V2))
      .then((currentListHeight: number) => {
        propPane.MoveToTab("Style");
        propPane.UpdatePropertyFieldValue("Item Spacing (px)", "16");
        agHelper
          .GetWidgetCSSHeight(
            locators._widgetInDeployed(draggableWidgets.LIST_V2),
          )
          .then((updatedListHeight: number) => {
            expect(currentListHeight).to.equal(updatedListHeight);
            agHelper.GetNAssertContains(locators._pagination, "5");
          });
      });
  });
});
