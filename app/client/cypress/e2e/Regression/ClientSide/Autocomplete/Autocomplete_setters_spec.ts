import {
  entityExplorer,
  jsEditor,
  agHelper,
  draggableWidgets,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

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
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "Button1");

    agHelper.GetElementsNAssertTextPresence(
      locators._hints,
      "Button1.setColor()",
    );

    //For table widget
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
    entityExplorer.SelectEntityByName("JSObject1");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.RemoveCharsNType(locators._codeMirrorTextArea, 7, "Table1.set");

    agHelper.GetElementsNAssertTextPresence(locators._hints, "setData()");
  });

  it("2. Check if setters are present in autocomplete for widgets in property Pane", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 600);

    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{Input1.set", true, false);
    agHelper.GetElementsNAssertTextPresence(locators._hints, "setDisabled()");
  });
});
