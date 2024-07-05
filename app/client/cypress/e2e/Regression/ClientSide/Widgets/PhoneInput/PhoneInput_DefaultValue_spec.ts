import {
    agHelper,
    locators,
    entityExplorer,
    propPane,
  } from "../../../../../support/Objects/ObjectsCore";
  const commonlocators = require("../../../../../locators/commonlocators.json");
  
  describe(
    "Phone Input widget Tests",
    { tags: ["@tag.Widget", "@tag.PhoneInput"] },
    function () {
      before(() => {
        entityExplorer.DragDropWidgetNVerify("phoneinputwidget", 550, 100);
      });
  
      it("1.Verify with text widget  when number is default value", () => {
        agHelper.UpdateCodeInput(propPane._propertyContentDefaultValueField, '9872139');
        entityExplorer.DragDropWidgetNVerify("textwidget", 550, 300);
        propPane.UpdatePropertyFieldValue("Text", "{{PhoneInput1.text}}");
        agHelper.ClickOutside();
        agHelper.GetNAssertContains(commonlocators.textwidget,"(987) 213-9")
      });
      it("2.Verify that error is shown when default value is not a number",() =>{
        agHelper.GetNClick(locators._input);
        agHelper.UpdateCodeInput(propPane._propertyContentDefaultValueField, 'jkwhejw');
        agHelper.VerifyEvaluatedErrorMessage('This value must be number');
      })
    },
  );
  