import * as _ from "../../../../support/Objects/ObjectsCore";

let jsName: any;

const jsObjectBody = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){

	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;

describe("Autocomplete tests for setters", () => {
  it("1. Check if setters are present in autocomplete for widgets in JsObject", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "Button1");

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "Button1.setColor()",
      "have.text",
      5,
    );

    //For table widget
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 500, 300);
    _.entityExplorer.SelectEntityByName("JSObject1");
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.RemoveCharsNType(
      _.locators._codeMirrorTextArea,
      7,
      "Table1.set",
    );

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "setData()",
      "have.text",
      0,
    );
  });

  it("2. Check if setters are present in autocomplete for widgets in property Pane", () => {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      200,
      600,
    );

    _.entityExplorer.SelectEntityByName("Button1");
    _.propPane.EnterJSContext("onClick", "{{Input1.set", true, false);
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "setDisabled()",
      "have.text",
      0,
    );
  });
});
