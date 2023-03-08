import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { WIDGET } from "../../../../locators/WidgetLocators";

const jsEditor = ObjectsRegistry.JSEditor,
  ee = ObjectsRegistry.EntityExplorer,
  agHelper = ObjectsRegistry.AggregateHelper,
  propPane = ObjectsRegistry.PropertyPane,
  CommonLocators = ObjectsRegistry.CommonLocators;

describe("JS Function Execution", function() {
  before(() => {
    ee.DragDropWidgetNVerify(WIDGET.BUTTON, 200, 200);
  });
  it("1. Shows js function data as part of autocompletion hints", function() {
    jsEditor.CreateJSObject(
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
    ee.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", `{{JSObject1.`, true, false);
    agHelper.AssertContains("myFun1.data");
    agHelper.AssertContains("myFun2.data");
  });
});
