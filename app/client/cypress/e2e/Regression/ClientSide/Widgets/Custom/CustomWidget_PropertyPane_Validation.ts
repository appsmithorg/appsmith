import {
  agHelper,
  assertHelper,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe("Custom widget Tests", {}, function () {
  before(() => {
    agHelper.AddDsl("customWidgetWithSrc");
  });

  const getIframeBody = () => {
    // get the iframe > document > body
    // and retry until the body element is not empty
    return cy
      .get(".t--widget-customwidget iframe")
      .last()
      .its("0.contentDocument.body")
      .should("not.be.empty")
      .then(cy.wrap);
  };

  it("should check that custom widget property pane details are coming up properly", () => {
    const defaultModel = `{
        "tips": [
          "Pass data to this widget in the default model field",
          "data in the javascript file using the appsmith.model variable",
          "Create events in the widget and trigger them in the javascript file using appsmith.triggerEvent('eventName')",
          "Access data in CSS as var(--appsmith-model-{property-name})"
        ]
      }`;
    const custom2WidgetBoundary =
      "//div[@data-widgetname-cy='Custom2']//div[contains(@class,'widget-component-boundary')]//div//div";

    EditorNavigation.SelectEntityByName("Custom2", EntityType.Widget);
    getIframeBody().find(".tip-container").should("exist");
    getIframeBody()
      .find(".tip-container p")
      .should(
        "have.text",
        "Pass data to this widget in the default model field",
      );

    agHelper.UpdateCodeInput(propPane._propDefaultModel, defaultModel);

    getIframeBody().find("button.primary").trigger("click");

    getIframeBody()
      .find(".tip-container p")
      .should(
        "have.text",
        "data in the javascript file using the appsmith.model variable",
      );

    EditorNavigation.SelectEntityByName("Custom1", EntityType.Widget);
    propPane.TogglePropertyState("Visible", "Off");
    agHelper.GetNClick(locators._previewModeToggle("edit"));
    agHelper.AssertElementAbsence(locators._widgetByName("Custom1"));
    agHelper.GetNClick(locators._previewModeToggle("preview"));
    propPane.TogglePropertyState("Visible", "On");

    EditorNavigation.SelectEntityByName("Custom2", EntityType.Widget);

    propPane.ToggleJSMode("onResetClick");
    propPane.EnterJSContext(
      "onResetClick",
      `{{showAlert('Reset Clicked', 'error');}}`,
    );
    getIframeBody().find("button.reset").trigger("click");
    agHelper.ValidateToastMessage("Reset Clicked");

    propPane.MoveToTab("Style");
    // Background color
    agHelper.GetNClick(propPane._propertyControlColorPicker("backgroundcolor"));
    agHelper.AssertElementVisibility(propPane._colorPickerV2Color);
    propPane.ToggleJSMode("backgroundcolor", true);
    propPane.UpdatePropertyFieldValue("Background color", "#eab308");
    agHelper.AssertCSS(
      `(${locators._draggableCustomWidget}//div)[10]`,
      "background-color",
      "rgb(239, 117, 65)",
    );
    propPane.ToggleJSMode("backgroundcolor", false);

    // Border Color
    propPane.SelectColorFromColorPicker("bordercolor", 13);
    assertHelper.AssertNetworkStatus("@updateLayout");

    agHelper
      .GetWidgetCSSFrAttribute(propPane._borderColorCursor, "background-color")
      .then((color) => {
        agHelper
          .GetWidgetCSSFrAttribute(custom2WidgetBoundary, "border-color")
          .then((bgcolor) => {
            expect(color).to.eq(bgcolor);
          });
      });

    // Verify border width
    propPane.UpdatePropertyFieldValue("Border width", "7");
    agHelper
      .GetWidgetCSSFrAttribute(custom2WidgetBoundary, "border-width")
      .then((width) => {
        expect(width).to.eq("7px");
      });
  });
});
