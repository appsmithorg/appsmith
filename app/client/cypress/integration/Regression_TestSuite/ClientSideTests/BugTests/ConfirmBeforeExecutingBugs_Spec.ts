import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

const jsObjectBody1 = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){

	},
	myFun2: async () => {
		showAlert("ran successfully");
	}
}`;

const jsObjectBody2 = `export default {
	myVar1: [],
	myVar2: {},
  myFun1: async function() {
		return showAlert('hi');
	},
	myFun2: function() {
		showAlert("myFun2 is running");

		return this.myFun1();
	},
}`;

describe("Confirm before executing a js function should always show a confirmation modal before executing", function () {
  it("1. Bug-17500: `Confirm before executing` setting does not work when a JS function is trigged on a button click", function () {
    _.jsEditor.CreateJSObject(jsObjectBody1, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.jsEditor.EnableDisableAsyncFuncSettings("myFun2", false, true);

    _.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON);
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");

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

  it("2. Bug-13646: Function execution does not wait for user confirmation when a nested function", function () {
    _.jsEditor.CreateJSObject(jsObjectBody2, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.jsEditor.EnableDisableAsyncFuncSettings("myFun1", false, true);

    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{JSObject2.myFun2()}}`, true, false);

    _.agHelper.ClickButton("Submit");
    _.agHelper.ValidateToastMessage("myFun2 is running");
    _.agHelper.AssertContains("Confirmation Dialog");

    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.ClickButton("Yes");
    _.agHelper.ValidateToastMessage("hi");

    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.ClickButton("Submit");
    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("JSObject2.myFun1 was cancelled", 1);
  });

  it("3. Bug-13646: Function execution does not wait for user confirmation when in a nested function and is run on page load", function () {
    _.entityExplorer.SelectEntityByName("JSObject2", "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("myFun2", true, false);

    _.agHelper.RefreshPage();

    _.agHelper.ValidateToastMessage("myFun2 is running");
    _.agHelper.AssertContains("Confirmation Dialog");

    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.ClickButton("Yes");
    _.agHelper.ValidateToastMessage("hi");

    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.RefreshPage();

    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("JSObject2.myFun1 was cancelled", 1);
  });
});
