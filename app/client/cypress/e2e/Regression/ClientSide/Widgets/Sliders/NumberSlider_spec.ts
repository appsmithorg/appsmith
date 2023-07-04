import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Number Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Number Slider
     * and a Text widget with binding {{NumberSlider1.value}}
     */
    _.agHelper.AddDsl("numberSliderWidgetDsl");
  });

  it("1. Validates Min. value", () => {
    // open the Property Pane
    _.entityExplorer.SelectEntityByName("NumberSlider1", "Widgets");

    _.propPane.UpdatePropertyFieldValue("Min. value", "110");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    _.propPane.UpdatePropertyFieldValue("Min. value", "");

    _.agHelper.VerifyEvaluatedErrorMessage("This value is required");

    _.propPane.UpdatePropertyFieldValue("Min. value", "zero");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Min. value", "0");

    // _.agHelper.VerifyEvaluatedValue("0");
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

    // _.agHelper.VerifyEvaluatedValue("100");
  });

  it("3. Validates Step Value", () => {
    _.propPane.UpdatePropertyFieldValue("Step size", "-10");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than 0.1",
    );

    _.propPane.UpdatePropertyFieldValue("Step size", "110");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    _.propPane.UpdatePropertyFieldValue("Step size", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Step size", "10");

    // _.agHelper.VerifyEvaluatedValue("10");
  });

  it("4. Validates Default Value", () => {
    _.propPane.UpdatePropertyFieldValue("Default value", "-10");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than or equal to the min value",
    );

    _.propPane.UpdatePropertyFieldValue("Default value", "110");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to the max value",
    );

    _.propPane.UpdatePropertyFieldValue("Default value", "asd");

    _.agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    _.propPane.UpdatePropertyFieldValue("Default value", "10");

    // _.agHelper.VerifyEvaluatedValue("10");
  });

  it("5. Change Step size and check if value changes", () => {
    // Assert Text widget has value 10
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("10");
      });

    // open the Property Pane
    _.entityExplorer.SelectEntityByName("NumberSlider1", "Widgets");

    // Change the Step size to 10
    _.propPane.UpdatePropertyFieldValue("Step size", "10");

    // Change the slider value
    _.agHelper
      .GetElement(_.locators._sliderThumb)
      .focus()
      .type("{rightArrow}")
      .wait(500);

    _.agHelper.Sleep(2000); //for the changes to reflect in text widget

    // Assert the Text widget has value 20
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("20");
      });

    // Change the slider value
    _.agHelper
      .GetElement(_.locators._sliderThumb)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    _.agHelper.Sleep(2000); //for the changes to reflect in text widget
    // Assert the Text widget has value 0
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("0");
      });
  });
});
