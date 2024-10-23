import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Evaluations causing error when page is cloned",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
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
      _.jsEditor.CreateJSObject(JS_OBJECT_BODY, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        "{{JSObject1.myFun1()}}",
      );

      _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

      PageList.ClonePage("Page1");
      _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

      PageList.ClonePage("Page1");
      _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");

      PageList.ClonePage("Page1 Copy");
      _.agHelper.AssertText(_.locators._inputWidget, "val", "Default text");
    });
  },
);
