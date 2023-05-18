import * as _ from "../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../locators/WidgetLocators";

describe("Evaluations causing error when page is cloned", function () {
  it("Bug: 20841: JSObjects | Sync methods | Not run consistently when Page is cloned", function () {
    const JS_OBJECT_BODY = `export default{
        myFun1: ()=>{
          return "Default text";
        },
    }`;
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.INPUT_V2, 200, 600);
    _.entityExplorer.NavigateToSwitcher("explorer");
    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    _.entityExplorer.SelectEntityByName("Input1");
    _.propPane.UpdatePropertyFieldValue(
      "Default Value",
      "{{JSObject1.myFun1()}}",
    );

    _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

    _.entityExplorer.ClonePage("Page1");
    _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

    _.entityExplorer.ClonePage("Page1");
    _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

    _.entityExplorer.ClonePage("Page1 Copy");
    _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");
  });
});
