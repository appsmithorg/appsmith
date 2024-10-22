import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS Function Execution",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.BUTTON,
        200,
        200,
      );
    });
    it("1. Shows js function data as part of autocompletion hints", function () {
      _.jsEditor.CreateJSObject(
        `export default {
  	myFun1: ()=>{
  		return "yes"
  	},
    myFun2:()=>{
        return [{name: "test"}]
    }
  }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: false,
        },
      );
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      _.propPane.EnterJSContext("onClick", `{{JSObject1.`, true, false);
      _.agHelper.AssertContains("myFun1.data");
      _.agHelper.AssertContains("myFun2.data");
    });
  },
);
