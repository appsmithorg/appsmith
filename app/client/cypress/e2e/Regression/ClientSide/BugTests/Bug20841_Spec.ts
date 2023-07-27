import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Evaluations causing error when page is cloned", function () {
  it("1. Bug: 20841: JSObjects | Sync methods | Not run consistently when Page is cloned", function () {
    const JS_OBJECT_BODY = `export default{
        myFun1: ()=>{
          return "Default text";
        },
    }`;
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      200,
      600,
    );
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    _.entityExplorer.SelectEntityByName("Input1");
    _.propPane.UpdatePropertyFieldValue(
      "Default value",
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
