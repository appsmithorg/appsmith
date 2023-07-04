import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import {
  agHelper,
  assertHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Category Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Category Slider
     * and a Text widget with binding {{CategorySlider1.value}}
     */
    agHelper.AddDsl("categorySliderWidgetDsl");
  });

  it("1. Validates Default Value", () => {
    // open the Property Pane
    entityExplorer.SelectEntityByName("CategorySlider1", "Widgets");

    propPane.UpdatePropertyFieldValue("Default value", "mdx");

    agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    propPane.UpdatePropertyFieldValue("Default value", "");

    agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    propPane.UpdatePropertyFieldValue("Default value", "md");

    //agHelper.VerifyEvaluatedValue("md");
  });

  it("2. Change Step Size and check if value changes", () => {
    // Assert Text widget has value 10
    agHelper
      .GetText(getWidgetSelector(draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("md");
      });

    // open the Property Pane
    entityExplorer.SelectEntityByName("CategorySlider1", "Widgets");

    // Change the slider value
    agHelper.GetElement(locators._sliderThumb).focus().type("{rightArrow}");

    agHelper.Sleep(500);
    // Assert the Text widget has value 20
    agHelper
      .GetText(getWidgetSelector(draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("lg");
      });

    // Change the slider value
    agHelper
      .GetElement(locators._sliderThumb)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    agHelper.Sleep(200);

    // Assert the Text widget has value 0
    agHelper
      .GetText(getWidgetSelector(draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("sm");
      });
  });

  it("3. Does not crash if an invalid mark option is passed", function () {
    propPane.EnterJSContext("Options", "[[]]");
    assertHelper.AssertContains(
      "Oops, Something went wrong.",
      "not.exist",
      locators._widgetByName("CategorySlider1"),
    );
  });
});
