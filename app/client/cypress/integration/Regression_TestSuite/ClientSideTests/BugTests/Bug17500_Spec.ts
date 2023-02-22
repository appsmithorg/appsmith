const dsl = require("../../../../fixtures/buttondsl.json");

import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

const jsObjectBody = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){

	},
	myFun2: async () => {
		showAlert("ran successfully");
	}
}`;

describe("Confirm before executing a js function should always show a confirmation modal before executing", function() {
  it("8. Bug-17500: `Confirm before executing` setting does not work when a JS function is trigged on a button click", function() {
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.jsEditor.EnableDisableAsyncFuncSettings("myFun2", false, true);

    _.ee.DragDropWidgetNVerify(WIDGET.BUTTON);
    _.ee.SelectEntityByName("Button1", "Widgets");

    _.propPane.EnterJSContext("onClick", `{{JSObject1.myFun2()}}`, true, false);

    _.agHelper.ClickButton("Submit");
    _.agHelper.AssertContains("Confirmation Dialog");
    _.agHelper.ClickButton("Yes");
    _.agHelper.ValidateToastMessage("ran successfully");

    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.ClickButton("Submit");
    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("JSObject1.myFun2 was cancelled");
  });
});
