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

  it("1. Validates Min. Value", () => {
    // open the Property Pane
    ee.SelectEntityByName("RangeSlider1", "Widgets");

    propPane.UpdatePropertyFieldValue("Min. Value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Min. Value", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Min. Value", "zero");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. Value", "0");

    // agHelper.VerifyEvaluatedValue("0");
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

    // agHelper.VerifyEvaluatedValue("100");
  });

  it("3. Validates Step Size", () => {
    propPane.UpdatePropertyFieldValue("Step Size", "10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to minRange",
    );

    propPane.UpdatePropertyFieldValue("Step Size", "");

    agHelper.VerifyEvaluatedErrorMessage("This value is required");

    propPane.UpdatePropertyFieldValue("Step Size", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Step Size", "1");

    // agHelper.VerifyEvaluatedValue("1");
  });

  it("4. Validates Min Range", () => {
    propPane.UpdatePropertyFieldValue("Min. Range", "0");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Min. Range", "-10");

    agHelper.VerifyEvaluatedErrorMessage("This value must be greater than 0.1");

    propPane.UpdatePropertyFieldValue("Min. Range", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Min. Range", "110");

    agHelper.VerifyEvaluatedErrorMessage("This value must be less than 100");

    propPane.UpdatePropertyFieldValue("Min. Range", "10");

    // agHelper.VerifyEvaluatedValue("10");
  });

  it("5. Validates Default Start Value", () => {
    propPane.UpdatePropertyFieldValue("Default Start Value", "-100");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than min value",
    );

    propPane.UpdatePropertyFieldValue("Default Start Value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than defaultEnd value",
    );

    propPane.UpdatePropertyFieldValue("Default Start Value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default Start Value", "10");

    // agHelper.VerifyEvaluatedValue("10");
  });

  it("6. Validates Default End Value", () => {
    propPane.UpdatePropertyFieldValue("Default End Value", "-10");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be greater than defaultStart value",
    );

    propPane.UpdatePropertyFieldValue("Default End Value", "110");

    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than max value",
    );

    propPane.UpdatePropertyFieldValue("Default End Value", "asd");

    agHelper.VerifyEvaluatedErrorMessage("This value must be a number");

    propPane.UpdatePropertyFieldValue("Default End Value", "100");

    // agHelper.VerifyEvaluatedValue("100");
  });

  it("7. Change Step Size and check if binding value changes", () => {
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

    // Change the Step Size to 10
    propPane.UpdatePropertyFieldValue("Min. Range", "10");
    propPane.UpdatePropertyFieldValue("Step Size", "10");

    agHelper
      .GetElement(locator._sliderThumb)
      .eq(0)
      .focus()
      .type("{rightArrow}");

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
