import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    const textMsg =
      "Dynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt height Dynamic panel validation for text widget Dynamic panel validation for text widget Dynamic panel validation for text widget";
    agHelper.AddDsl("DynamicHeightModalDsl");

    entityExplorer.SelectEntityByName("Modal1", "Widgets");

    agHelper
      .GetWidgetCSSFrAttribute(locators._modal, "height")

      // agHelper.GetWidgetCSSHeight(locators._widgetInDeployed("modal"))
      .then((currentModalHeight: number) => {
        entityExplorer.SelectEntityByName("Text1", "Modal1");
        agHelper.AssertElementVisible(propPane._propertyPaneHeightLabel);
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        entityExplorer.SelectEntityByName("Text1");
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
            entityExplorer.SelectEntityByName("Modal1");
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
