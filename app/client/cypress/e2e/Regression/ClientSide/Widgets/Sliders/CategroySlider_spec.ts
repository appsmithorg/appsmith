import { getWidgetSelector } from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Category Slider spec", () => {
  before(() => {
    /**
     * On the canvas we have a Category Slider
     * and a Text widget with binding {{CategorySlider1.value}}
     */
    cy.fixture("categorySliderWidgetDsl").then((dsl: string) => {
      _.agHelper.AddDsl(dsl);
    });
  });

  it("1. Validates Default Value", () => {
    // open the Property Pane
    _.entityExplorer.SelectEntityByName("CategorySlider1", "Widgets");

    _.propPane.UpdatePropertyFieldValue("Default value", "mdx");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    _.propPane.UpdatePropertyFieldValue("Default value", "");

    _.agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    _.propPane.UpdatePropertyFieldValue("Default value", "md");

    // _.agHelper.VerifyEvaluatedValue("md");
  });

  it("2. Change Step Size and check if value changes", () => {
    // Assert Text widget has value 10
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("md");
      });

    // open the Property Pane
    _.entityExplorer.SelectEntityByName("CategorySlider1", "Widgets");

    // Change the slider value
    _.agHelper.GetElement(_.locators._sliderThumb).focus().type("{rightArrow}");

    // Assert the Text widget has value 20
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("lg");
      });

    // Change the slider value
    _.agHelper
      .GetElement(_.locators._sliderThumb)
      .focus()
      .type("{leftArrow}")
      .type("{leftArrow}");

    _.agHelper.Sleep(200);

    // Assert the Text widget has value 0
    _.agHelper
      .GetText(getWidgetSelector(_.draggableWidgets.TEXT))
      .then(($label) => {
        expect($label).to.eq("sm");
      });
  });

  it("does not crash if an invalid mark option is passed", function () {
    cy.get(".t--property-control-options .t--js-toggle").first().click();
    cy.updateCodeInput(".t--property-control-options", "[[]]");
    cy.get(".t--widget-categorysliderwidget")
      .contains("Oops, Something went wrong.")
      .should("not.exist");
  });
});
