import {
    INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
    createMessage,
  } from "../../../../../../src/ce/constants/messages";
  import {
    agHelper,
    locators,
    entityExplorer,
    propPane,
  } from "../../../../../support/Objects/ObjectsCore";
  
  //The test verifies that the phone input widget correctly enforces the maximum character limit by setting the limit to 9,
  // entering a 9-digit number to check if it accepts it, and then entering a longer default value to ensure an error message is displayed.
  //  It also ensures that the specific error message is correctly shown when the default value exceeds the specified maximum length.
  
  describe(
    "Phone Input widget Tests",
    { tags: ["@tag.Widget", "@tag.PhoneInput"] },
    () => {
      it("1.Verifies that the phone input field correctly limits the number of characters based on the specified length. If the default value exceeds this length, an error should be displayed.", () => {
        entityExplorer.DragDropWidgetNVerify("phoneinputwidget", 550, 100);
  
        propPane.UpdatePropertyFieldValue("Max Length", "9");
        agHelper.ClickOutside();
        agHelper.TypeText(locators._input, "983621265");
        agHelper.UpdateCodeInput(
          propPane._propertyContentDefaultValueField,
          "987213994873",
        );
        agHelper.GetNClick(locators._input);
        const errorMessage = createMessage(INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR, 9);
        agHelper.GetNAssertContains(propPane._popOverContent, errorMessage);
      });
    },
  );