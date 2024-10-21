import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const jsObjectBody = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){

	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;

describe(
  "Autocomplete tests for setters",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 200);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHECKBOX, 300, 300);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SWITCH, 400, 400);
    });

    it("1. Check if setters are present in autocomplete for widgets in JsObject", () => {
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
        "Button1.setColor",
      );
      agHelper.GetElementsNAssertTextPresence(
        locators._hints,
        "Button1.setDisabled",
      );
      agHelper.GetElementsNAssertTextPresence(
        locators._hints,
        "Button1.setVisibility",
      );

      agHelper.RemoveCharsNType(locators._codeMirrorTextArea, 7, "Input1.set");

      agHelper.GetElementsNAssertTextPresence(locators._hints, "setValue");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setDisabled");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setVisibility");

      agHelper.RemoveCharsNType(
        locators._codeMirrorTextArea,
        10,
        "Checkbox1.set",
      );

      agHelper.GetElementsNAssertTextPresence(locators._hints, "setValue");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setDisabled");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setVisibility");

      agHelper.RemoveCharsNType(
        locators._codeMirrorTextArea,
        13,
        "Switch1.set",
      );

      agHelper.GetElementsNAssertTextPresence(locators._hints, "setDisabled");
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setRequired");
    });

    it("2. Check if setters are present in autocomplete for widgets in property Pane", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 500, 500);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{Input1.set", true, false);
      agHelper.GetElementsNAssertTextPresence(locators._hints, "setDisabled");
    });

    it("3. function arguments hint shows up", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{", true, false);
      agHelper.GetNClickByContains(locators._hints, "appsmith", 0, false);
      agHelper.AssertElementVisibility(locators._evalValuePopover);
      propPane.EnterJSContext("onClick", "{{showAlert", true, false);
      agHelper.GetElementsNAssertTextPresence(locators._hints, "showAlert");
      agHelper.AssertElementAbsence(locators._evalValuePopover);
      agHelper.GetNClickByContains(locators._hints, "showAlert", 0, false);
      agHelper.GetNAssertElementText(
        locators._argHintFnName,
        "showAlert",
        "contain.text",
      );
      agHelper.AssertElementAbsence(locators._evalValuePopover);
    });

    it("4. function description tooltip shows up", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{showAlert", true, false);
      agHelper.GetElementsNAssertTextPresence(locators._hints, "showAlert");
      agHelper.AssertElementExist(locators._tern_doc);
    });
  },
);
