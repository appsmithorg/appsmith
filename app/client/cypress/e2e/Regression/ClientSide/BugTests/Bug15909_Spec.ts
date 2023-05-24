import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JS Function Execution", function () {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
  });
  it("1. Shows js function data as part of autocompletion hints", function () {
    _.entityExplorer.NavigateToSwitcher("Explorer");
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
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.EnterJSContext("onClick", `{{JSObject1.`, true, false);
    _.agHelper.AssertContains("myFun1.data");
    _.agHelper.AssertContains("myFun2.data");
  });
});
