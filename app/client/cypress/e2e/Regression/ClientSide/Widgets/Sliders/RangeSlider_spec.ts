import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";
describe("Range Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Range Slider
     * and a Text widget with binding {{RangeSlider1.value}}
     */
    _.agHelper.AddDsl("rangeSliderWidgetDsl");
  });

  it("1. Validates Min. value", () => {
    // open the Property Pane
    _.entityExplorer.SelectEntityByName("RangeSlider1", "Widgets");

    _.propPane.UpdatePropertyFieldValue("Min. value", "110");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    _.propPane.UpdatePropertyFieldValue("Min. value", "");

    _.agHelper.VerifyEvaluatedErrorMessage("This value is required");

    _.propPane.UpdatePropertyFieldValue("Min. value", "zero");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Min. value", "0");
  });

  it("2. Validates Max. value", () => {
    _.propPane.UpdatePropertyFieldValue("Max. value", "0");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than min value",
    );

    _.propPane.UpdatePropertyFieldValue("Max. value", "");

    _.agHelper.VerifyEvaluatedErrorMessage("This value is required");

    _.propPane.UpdatePropertyFieldValue("Max. value", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Max. value", "100");
  });

  it("3. Validates Step size", () => {
    _.propPane.UpdatePropertyFieldValue("Step size", "10");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to minRange",
    );

    _.propPane.UpdatePropertyFieldValue("Step size", "");

    _.agHelper.VerifyEvaluatedErrorMessage("This value is required");

    _.propPane.UpdatePropertyFieldValue("Step size", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Step size", "1");
  });

  it("4. Validates Min Range", () => {
    _.propPane.UpdatePropertyFieldValue("Min. range", "0");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than 0.1",
    );

    _.propPane.UpdatePropertyFieldValue("Min. range", "-10");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than 0.1",
    );

    _.propPane.UpdatePropertyFieldValue("Min. range", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Min. range", "110");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    _.propPane.UpdatePropertyFieldValue("Min. range", "10");
  });

  it("5. Validates Default start value", () => {
    _.propPane.UpdatePropertyFieldValue("Default start value", "-100");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than or equal to the min value",
    );

    _.propPane.UpdatePropertyFieldValue("Default start value", "110");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than defaultEnd value",
    );

    _.propPane.UpdatePropertyFieldValue("Default start value", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Default start value", "10");
  });

  it("6. Validates Default end value", () => {
    _.propPane.UpdatePropertyFieldValue("Default end value", "-10");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than defaultStart value",
    );

    _.propPane.UpdatePropertyFieldValue("Default end value", "110");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to the max value",
    );

    _.propPane.UpdatePropertyFieldValue("Default end value", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Default end value", "100");
  });

  it("7. Change Step size and check if binding value changes", () => {
    // Assert Text widget has value 10
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT), "text", 0)
      .then(($label) => {
        expect($label).to.eq("10");
      });

    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT), "text", 1)
      .then(($label) => {
        expect($label).to.eq("100");
      });

    // Change the Step size to 10
    _.propPane.UpdatePropertyFieldValue("Min. range", "10");
    _.propPane.UpdatePropertyFieldValue("Step size", "10");

    _.agHelper
      .GetElement(_.locators._sliderThumb)
      .eq(0)
      .focus()
      .type("{rightArrow}")
      .wait(500);

    // Assert the Text widget has value 20
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT), "text", 0)
      .then(($label) => {
        expect($label).to.eq("20");
      });

    // Change the slider value
    _.agHelper
      .GetElement(_.locators._sliderThumb)
      .eq(1)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    _.agHelper.Sleep(200);

    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT), "text", 1)
      .then(($label) => {
        expect($label).to.eq("80");
      });
  });
});
