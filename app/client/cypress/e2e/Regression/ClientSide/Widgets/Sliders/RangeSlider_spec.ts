import {
  getWidgetSelector,
  WIDGET,
} from "../../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;
const ee = ObjectsRegistry.EntityExplorer;
const propPane = ObjectsRegistry.PropertyPane;
const locator = ObjectsRegistry.CommonLocators;

describe("Range Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Range Slider
     * and a Text widget with binding {{RangeSlider1.value}}
     */
    cy.fixture("rangeSliderWidgetDsl").then((dsl: string) => {
      agHelper.AddDsl(dsl);
    });
  });

  it("1. Validates Min. value", () => {
    // open the Property Pane
    ee.SelectEntityByName("RangeSlider1", "Widgets");

    propPane.UpdatePropertyFieldValue("Min. value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Min. value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Min. value", "zero");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. value", "0");
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
  });

  it("3. Validates Step size", () => {
    propPane.UpdatePropertyFieldValue("Step size", "10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to minRange",
    );

    propPane.UpdatePropertyFieldValue("Step size", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Step size", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Step size", "1");
  });

  it("4. Validates Min Range", () => {
    propPane.UpdatePropertyFieldValue("Min. range", "0");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Min. range", "-10");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Min. range", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. range", "110");

    agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    propPane.UpdatePropertyFieldValue("Min. range", "10");
  });

  it("5. Validates Default start value", () => {
    propPane.UpdatePropertyFieldValue("Default start value", "-100");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than or equal to the min value",
    );

    propPane.UpdatePropertyFieldValue("Default start value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than defaultEnd value",
    );

    propPane.UpdatePropertyFieldValue("Default start value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default start value", "10");
  });

  it("6. Validates Default end value", () => {
    propPane.UpdatePropertyFieldValue("Default end value", "-10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than defaultStart value",
    );

    propPane.UpdatePropertyFieldValue("Default end value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to the max value",
    );

    propPane.UpdatePropertyFieldValue("Default end value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default end value", "100");
  });

  it("7. Change Step size and check if binding value changes", () => {
    // Assert Text widget has value 10
    agHelper
      .GetText(getWidgetSelector(WIDGET.TEXT), "text", 0)
      .then(($label) => {
        expect($label).to.eq("10");
      });

    agHelper
      .GetText(getWidgetSelector(WIDGET.TEXT), "text", 1)
      .then(($label) => {
        expect($label).to.eq("100");
      });

    // Change the Step size to 10
    propPane.UpdatePropertyFieldValue("Min. range", "10");
    propPane.UpdatePropertyFieldValue("Step size", "10");

    agHelper
      .GetElement(locator._sliderThumb)
      .eq(0)
      .focus()
      .type("{rightArrow}")
      .wait(500);

    // Assert the Text widget has value 20
    agHelper
      .GetText(getWidgetSelector(WIDGET.TEXT), "text", 0)
      .then(($label) => {
        expect($label).to.eq("20");
      });

    // Change the slider value
    agHelper
      .GetElement(locator._sliderThumb)
      .eq(1)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    agHelper.Sleep(200);

    agHelper
      .GetText(getWidgetSelector(WIDGET.TEXT), "text", 1)
      .then(($label) => {
        expect($label).to.eq("80");
      });
  });
});
