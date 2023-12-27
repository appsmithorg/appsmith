import {
  agHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation",
  { tags: ["@tag.AutoHeight"] },
  function () {
    it("1. Validate change with auto height width for List widgets", function () {
      agHelper.AddDsl("ResizeListDsl");
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget, {}, [
        "Tabs1",
        "Tab 1",
      ]);
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.LIST_V2),
        )
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
  },
);
