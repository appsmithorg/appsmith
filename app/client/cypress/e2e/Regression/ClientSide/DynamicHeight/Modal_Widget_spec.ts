import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    const textMsg =
      "Dynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt height Dynamic panel validation for text widget Dynamic panel validation for text widget Dynamic panel validation for text widget";
    cy.fixture("DynamicHeightModalDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Modal1", "Widgets");

    agHelper
      .GetWidgetCSSFrAttribute(".t--modal-widget", "height")

      // agHelper.GetWidgetCSSHeight(locators._widgetInDeployed("modal"))
      .then((currentModalHeight: number) => {
        entityExplorer.SelectEntityByName("Text1", "Modal1");
        agHelper.AssertElementVisible(locators._propertyPaneHeightLabel);
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        entityExplorer.SelectEntityByName("Text1");
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("textwidget"))
          .then((currentTextWidgetHeight: number) => {
            propPane.TypeTextIntoField("text", textMsg, true);
            assertHelper.AssertNetworkStatus("@updateLayout");
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("textwidget"))
              .then((updatedTextWidgetHeight: number) => {
                expect(currentTextWidgetHeight).to.not.equal(
                  updatedTextWidgetHeight,
                );
              });
            entityExplorer.SelectEntityByName("Modal1");
            propPane.SelectPropertiesDropDown("height", "Auto Height");
            agHelper.Sleep(3000);
            agHelper
              .GetWidgetCSSFrAttribute(".t--modal-widget", "height")
              // agHelper.GetWidgetCSSHeight(locators._widgetInDeployed("widget"))
              .then((updatedModalHeight: number) => {
                expect(currentModalHeight).to.not.equal(updatedModalHeight);
              });
          });
      });
  });
});
