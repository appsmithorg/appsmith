import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import { NUMBER_ERROR_MESSAGE } from "../../../../../support/Objects/PhoneInputWidgetErrorMessage";
const commonlocators = require("../../../../../locators/commonlocators.json");

// This test spec for the Phone Input widget can be summarized in two simple steps:

// Verify Default Phone Number:
// Add a Phone Input widget with the default value "9872139" and a Text widget displaying its value.
// Confirm the Text widget shows the formatted number "(987) 213-9".

// Verify Error for Non-Numeric Input:
// Change the Phone Input widget's value to "notnumber" (a non-numeric value).
// Ensure an error message "This value must be number" is displayed.

describe(
  "Phone Input widget Tests",
  { tags: ["@tag.Widget", "@tag.PhoneInput"] },
  () => {
    it("1.Verify with text widget  when number is default value and shows error when its not a number", () => {
      entityExplorer.DragDropWidgetNVerify("phoneinputwidget", 550, 100);
      agHelper.UpdateCodeInput(
        propPane._propertyContentDefaultValueField,
        "9872139",
      );
      entityExplorer.DragDropWidgetNVerify("textwidget", 550, 300);
      propPane.UpdatePropertyFieldValue("Text", "{{PhoneInput1.text}}");
      agHelper.ClickOutside();
      agHelper.GetNAssertContains(commonlocators.textwidget, "(987) 213-9");
      agHelper.GetNClick(locators._input);
      agHelper.UpdateCodeInput(
        propPane._propertyContentDefaultValueField,
        "notnumber",
      );
      agHelper.VerifyEvaluatedErrorMessage(NUMBER_ERROR_MESSAGE);
    });
  },
);
