import { RATING_WIDGET } from "../../../../../locators/RatingWidgetLocators";

import {
  agHelper,
  fakerHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Rating widet testcases",
  { tags: ["@tag.Widget", "@tag.Rating", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.RATING);
    });

    it("1. Validate Max rating and Default rating", () => {
      agHelper.AssertElementLength(RATING_WIDGET.star_icon, 10);
      // assert error on decimal value in max rating
      propPane.UpdatePropertyFieldValue("Max rating", "1.5");
      agHelper.VerifyEvaluatedErrorMessage(
        "Value should be a positive integer",
      );
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
      agHelper.AssertElementLength(RATING_WIDGET.star_icon, 2);
      propPane.UpdatePropertyFieldValue("Max rating", "{{parseInt(2.5)}}");
      agHelper.AssertElementLength(RATING_WIDGET.star_icon, 4);
      // assert the no. of stars on increasing max rating value to 10
      propPane.UpdatePropertyFieldValue("Max rating", "10");
      agHelper.AssertElementLength(RATING_WIDGET.star_icon, 20);
      // assert default no. of stars rated
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(100), 3);
      // change default no. of stars and assert the same
      propPane.UpdatePropertyFieldValue("Default rating", "5");
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(100), 5);
      // change default no. of stars to decimal value and assert error
      propPane.UpdatePropertyFieldValue("Default rating", "7.5");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value can be a decimal only if 'Allow half' is true",
      );
      // turn on allow half stars and assert to be able to fill decimal value
      propPane.TogglePropertyState("Allow half stars", "On");
      propPane.UpdatePropertyFieldValue("Default rating", "7.9");
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(100), 7);
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(90), 1);

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

    it("2. Validations on Tooltip values", () => {
      propPane.UpdatePropertyFieldValue("Max rating", "10");
      propPane.UpdatePropertyFieldValue("Default rating", "5");
      // set list of string as values for tooltips in UpdatePropertyFieldValue
      propPane.UpdatePropertyFieldValue("Tooltips", "[1,2,3]");
      propPane.UpdatePropertyFieldValue("Tooltips", "Bad,Good,Neutral");
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type Array<string>",
      );
      propPane.UpdatePropertyFieldValue(
        "Tooltips",
        '["Worse","Bad","Neutral"]',
      );
      // deploy app and check if able to click on stars
      deployMode.DeployApp();
      agHelper.GetNClick(RATING_WIDGET.star_icon, 12, true, 0);
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(100), 7);
      agHelper.HoverElement(RATING_WIDGET.star_icon, 4);
      agHelper.AssertPopoverTooltip("Neutral"); // assert tooltip on hovering
      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(RATING_WIDGET.ratingwidget);
    });

    it("3. Verify readonly, disabled and visibility of rating widget", () => {
      // update max rating and default rating for new case
      propPane.UpdatePropertyFieldValue("Max rating", "15");
      propPane.UpdatePropertyFieldValue("Default rating", "3");
      // turn visible off
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      // assert rating widget is not present - since visbible is off
      agHelper.AssertElementAbsence(RATING_WIDGET.ratingwidget);
      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(RATING_WIDGET.ratingwidget);
      // turn visible on
      propPane.TogglePropertyState("Visible", "On");
      // make the widget read only
      propPane.TogglePropertyState("Read only", "On");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(RATING_WIDGET.ratingwidget);
      // assert even after clicking on stars, the stars are not changed since its read only
      agHelper.GetNClick(RATING_WIDGET.star_icon, 12, true, 0);
      agHelper.AssertElementLength(RATING_WIDGET.star_icon_filled(100), 3);

      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(RATING_WIDGET.ratingwidget);
      propPane.TogglePropertyState("Read only", "Off");
    });

    it("4. check events - On change rating widget", () => {
      propPane.UpdatePropertyFieldValue("Default rating", "1");
      // set an alert on clicking ratings
      propPane.SelectPlatformFunction("onChange", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Thanks for rating us!",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      // deploy app and click on stars and assert the alert
      deployMode.DeployApp();
      agHelper.GetNClick(RATING_WIDGET.star_icon, 4, true, 0);
      agHelper.ValidateToastMessage("Thanks for rating us!");

      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(RATING_WIDGET.ratingwidget);
      // open a modal on clicking ratings
      propPane.CreateModal("onChange");
      // deploy app and click on stars and close the modal
      deployMode.DeployApp();
      agHelper.GetNClick(RATING_WIDGET.star_icon, 5, true, 0);

      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(RATING_WIDGET.ratingwidget);
      agHelper.ClickButton("Close");
    });

    it("5. Rename, Copy Delete - rating widget", () => {
      // rename widget from property pane
      propPane.RenameWidget("Rating1", "RateUs");
      // copy widget from property pane and assert copied info
      propPane.CopyPasteWidgetFromPropertyPane("RateUs");
      agHelper.ValidateToastMessage("Copied RateUs");
    });
  },
);
