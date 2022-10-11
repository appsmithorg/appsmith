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

  it("1. Validates Min. Value", () => {
    // open the Property Pane
    ee.SelectEntityByName("NumberSlider1", "Widgets");

    propPane.UpdatePropertyFieldValue("Min. Value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Min. Value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Min. Value", "zero");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. Value", "0");

    agHelper.VerifyEvaluatedValue("0");
  });

  it("2. Validates Max. Value", () => {
    propPane.UpdatePropertyFieldValue("Max. Value", "0");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than min value",
    );

    propPane.UpdatePropertyFieldValue("Max. Value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Max. Value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Max. Value", "100");

    agHelper.VerifyEvaluatedValue("100");
  });

  it("3. Validates Step Value", () => {
    propPane.UpdatePropertyFieldValue("Step Size", "-10");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Step Size", "110");

    agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    propPane.UpdatePropertyFieldValue("Step Size", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Step Size", "10");

    agHelper.VerifyEvaluatedValue("10");
  });

  it("4. Validates Default Value", () => {
    propPane.UpdatePropertyFieldValue("Default Value", "-10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than min value",
    );

    propPane.UpdatePropertyFieldValue("Default Value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Default Value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default Value", "10");

    agHelper.VerifyEvaluatedValue("10");
  });

  it("5. Change Step Size and check if value changes", () => {
    // Assert Text widget has value 10
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
      expect($label).to.eq("10");
    });

    // open the Property Pane
    ee.SelectEntityByName("NumberSlider1", "Widgets");

    // Change the Step Size to 10
    propPane.UpdatePropertyFieldValue("Step Size", "10");

    // Change the slider value
    agHelper
      .GetElement(locator._sliderThumb)
      .focus()
      .type("{rightArrow}");

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

    agHelper.Sleep(200);

    // Assert the Text widget has value 0
    agHelper.GetText(getWidgetSelector(WIDGET.TEXT)).then(($label) => {
      expect($label).to.eq("0");
    });
  });
});
