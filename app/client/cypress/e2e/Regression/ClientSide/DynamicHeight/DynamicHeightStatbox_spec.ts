import {
  agHelper,
  assertHelper,
  draggableWidgets,
  locators,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Adjustment for Statbox Widget",
  { tags: ["@tag.AutoHeight"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.STATBOX);
    });
    it("Validate decreasing height of Statbox widget by removing its widgets", function () {
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Auto Height");

      // Function to delete widget and verify height change
      function deleteWidgetAndVerifyHeightChange(widgetName: string) {
        agHelper
          .GetWidgetCSSHeight(
            locators._widgetInDeployed(draggableWidgets.STATBOX),
          )
          .then(($currentStatboxHeight) => {
            EditorNavigation.SelectEntityByName(
              widgetName,
              EntityType.Widget,
              {},
              ["Statbox1"],
            );
            agHelper.PressDelete();
            agHelper.WaitUntilAllToastsDisappear();
            assertHelper.AssertNetworkStatus("updateLayout");
            agHelper.Sleep(2000);

            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed(draggableWidgets.STATBOX),
              )
              .then(($updatedStatboxHeight) => {
                // Verify that the height of the Statbox widget has decreased
                expect($currentStatboxHeight).to.not.equal(
                  $updatedStatboxHeight,
                );
              });
          });
      }

      // Delete bottom text widget from statbox and verify height change
      deleteWidgetAndVerifyHeightChange("Text3");

      // Delete icon button widget from statbox and verify height change
      deleteWidgetAndVerifyHeightChange("IconButton1");
    });
  },
);
