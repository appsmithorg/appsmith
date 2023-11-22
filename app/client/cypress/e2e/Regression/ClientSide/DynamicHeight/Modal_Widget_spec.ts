import {
  agHelper,
  assertHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    const textMsg =
      "Dynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt height Dynamic panel validation for text widget Dynamic panel validation for text widget Dynamic panel validation for text widget";
    agHelper.AddDsl("DynamicHeightModalDsl");

    EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);

    agHelper
      .GetWidgetCSSFrAttribute(locators._modal, "height")

      // agHelper.GetWidgetCSSHeight(locators._widgetInDeployed("modal"))
      .then((currentModalHeight: number) => {
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
          "Modal1",
        ]);
        agHelper.AssertElementVisibility(propPane._propertyPaneHeightLabel);
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.TEXT))
          .then((currentTextWidgetHeight: number) => {
            propPane.UpdatePropertyFieldValue("Text", textMsg, true);
            assertHelper.AssertNetworkStatus("@updateLayout", 200);
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed(draggableWidgets.TEXT),
              )
              .then((updatedTextWidgetHeight: number) => {
                expect(currentTextWidgetHeight).to.not.equal(
                  updatedTextWidgetHeight,
                );
              });
            EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
            propPane.SelectPropertiesDropDown("height", "Auto Height");
            agHelper
              .GetWidgetCSSFrAttribute(locators._modal, "height")
              // agHelper.GetWidgetCSSHeight(locators._widgetInDeployed("widget"))
              .then((updatedModalHeight: number) => {
                expect(currentModalHeight).to.not.equal(updatedModalHeight);
              });
          });
      });
  });
});
