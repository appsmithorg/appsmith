import {
  getWidgetSelector,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;
const propPane = ObjectsRegistry.PropertyPane;
const locator = ObjectsRegistry.CommonLocators;

describe("Number Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Number Slider
     * and a Text widget with binding {{NumberSlider1.value}}
     */
    cy.fixture("numberSliderWidgetDsl").then((dsl: string) => {
      agHelper.AddDsl(dsl);
    });
  });

  it("1. Validates Min. value", () => {
    // open the Property Pane
    ee.SelectEntityByName("NumberSlider1", "Widgets");

    propPane.UpdatePropertyFieldValue("Min. value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Min. value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Min. value", "zero");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. value", "0");

    // agHelper.VerifyEvaluatedValue("0");
  });

  it("2. Validates Max. value", () => {
    propPane.UpdatePropertyFieldValue("Max. value", "0");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than min value",
    );

    propPane.UpdatePropertyFieldValue("Max. value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Max. value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Max. value", "100");

    // agHelper.VerifyEvaluatedValue("100");
  });

  it("3. Validates Step Value", () => {
    propPane.UpdatePropertyFieldValue("Step size", "-10");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Step size", "110");

    agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    propPane.UpdatePropertyFieldValue("Step size", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Step size", "10");

    // agHelper.VerifyEvaluatedValue("10");
  });

  it("4. Validates Default Value", () => {
    propPane.UpdatePropertyFieldValue("Default value", "-10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than or equal to the min value",
    );

    propPane.UpdatePropertyFieldValue("Default value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to the max value",
    );

    propPane.UpdatePropertyFieldValue("Default value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default value", "10");

    // agHelper.VerifyEvaluatedValue("10");
  });

  it("5. Change Step size and check if value changes", () => {
    // Assert Text widget has value 10
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
      expect($label).to.eq("10");
    });

    // open the Property Pane
    ee.SelectEntityByName("NumberSlider1", "Widgets");

    // Change the Step size to 10
    propPane.UpdatePropertyFieldValue("Step size", "10");

    // Change the slider value
    agHelper
      .GetElement(locator._sliderThumb)
      .focus()
      .type("{rightArrow}")
      .wait(500);

    agHelper.Sleep(2000); //for the changes to reflect in text widget

    // Assert the Text widget has value 20
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
      expect($label).to.eq("20");
    });

    // Change the slider value
    agHelper
      .GetElement(locator._sliderThumb)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    agHelper.Sleep(2000); //for the changes to reflect in text widget
    // Assert the Text widget has value 0
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
      expect($label).to.eq("0");
    });
  });
});
