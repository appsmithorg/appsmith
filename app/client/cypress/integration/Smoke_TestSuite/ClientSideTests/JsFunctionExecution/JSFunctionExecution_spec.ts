import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor;

describe("JS Function Execution", function() {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
  });

  it("Allows execution of js function when lint warnings(not errors) are present in code", function() {
    jsEditor.CreateJSObject(
      `export default {
	myFun1: ()=>{
		debugger;
		return "yes"
	}
}`,
      true,
      true,
      false,
    );

    jsEditor.AssertParseError(false);
  });

  it("Prevents execution of js function when parse errors are present in code", function() {
    jsEditor.CreateJSObject(
      `export default {
	myFun1: ()=>{
		return "yes"
	},
  myFun2: ()
}`,
      true,
      true,
      false,
    );

    jsEditor.AssertParseError(true);
  });

  it("Allows execution of other JS functions when lint error is present in code one JS function", function() {
    jsEditor.CreateJSObject(
      `export default {
        myFun1:  (a ,b)=>{ 
        return f
        },
        myFun2 :()=>{
          return "yes"
        }
      }`,
      true,
      true,
      false,
    );

    jsEditor.AssertParseError(false);
  });
});
