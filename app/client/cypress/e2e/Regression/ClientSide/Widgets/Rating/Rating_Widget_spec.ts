import { RATING_WIDGET } from "../../../../../locators/RatingWidgetLocators";

import {
  agHelper,
  fakerHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import widgetsLoc from "../../../../../locators/Widgets.json";

describe("Rating widet testcases", () => {
  it("1. Validate Max rating and Default rating", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.RATING, 450, 200);
    agHelper.GetElement(RATING_WIDGET.star_icon).should("have.length", 10);
    // assert error on decimal value in max rating
    propPane.UpdatePropertyFieldValue("Max rating", "1.5");
    agHelper.VerifyEvaluatedErrorMessage("Value should be a positive integer");
    // assert error on text value in max rating
    propPane.UpdatePropertyFieldValue(
      "Max rating",
      fakerHelper.GetRandomText(),
    );
    agHelper.VerifyEvaluatedErrorMessage(
      "This value does not evaluate to type number",
    );
    // assert error on symbol value in max rating
    propPane.UpdatePropertyFieldValue(
      "Max rating",
      fakerHelper.GetUSPhoneNumber(),
    );
    agHelper.VerifyEvaluatedErrorMessage(
      "This value does not evaluate to type number",
    );
    // assert no error on using parse int function in max rating
    propPane.UpdatePropertyFieldValue("Max rating", "{{parseInt(1)}}");
    agHelper.GetElement(RATING_WIDGET.star_icon).should("have.length", 2);
    propPane.UpdatePropertyFieldValue("Max rating", "{{parseInt(2.5)}}");
    agHelper.GetElement(RATING_WIDGET.star_icon).should("have.length", 4);
    // assert the no. of stars on increasing max rating value to 10
    propPane.UpdatePropertyFieldValue("Max rating", "10");
    agHelper.GetElement(RATING_WIDGET.star_icon).should("have.length", 20);
    // assert default no. of stars rated
    agHelper
      .GetElement(RATING_WIDGET.star_icon_filled(100))
      .should("have.length", 3);
    // change default no. of stars and assert the same
    propPane.UpdatePropertyFieldValue("Default rating", "5");
    agHelper
      .GetElement(RATING_WIDGET.star_icon_filled(100))
      .should("have.length", 5);
    // change default no. of stars to decimal value and assert error
    propPane.UpdatePropertyFieldValue("Default rating", "7.5");
    agHelper.VerifyEvaluatedErrorMessage(
      "This value can be a decimal only if 'Allow half' is true",
    );
    // turn on allow half stars and assert to be able to fill decimal value
    agHelper.GetNClick(RATING_WIDGET.allowhalfstars);
    propPane.UpdatePropertyFieldValue("Default rating", "7.9");
    agHelper
      .GetElement(RATING_WIDGET.star_icon_filled(100))
      .should("have.length", 7);
    agHelper
      .GetElement(RATING_WIDGET.star_icon_filled(90))
      .should("have.length", 1);
    agHelper.GetNClick(RATING_WIDGET.allowhalfstars);
    // turn off allow half stars and assert to not be able to fill decimal value
    propPane.EnterJSContext("Allow half stars", "false");
    propPane.UpdatePropertyFieldValue("Default rating", "1.1");
    agHelper.VerifyEvaluatedErrorMessage(
      "This value can be a decimal only if 'Allow half' is true",
    );
    // set default rating value greater than max rating and assert error
    propPane.UpdatePropertyFieldValue("Max rating", "3");
    propPane.UpdatePropertyFieldValue("Default rating", "4");
    agHelper.VerifyEvaluatedErrorMessage(
      "This value must be less than or equal to max count",
    );
  });
});
