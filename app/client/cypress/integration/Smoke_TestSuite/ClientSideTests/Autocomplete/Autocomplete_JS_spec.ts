import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { JSEditor: jsEditor } = ObjectsRegistry;

const jsObjectBody = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){
		
	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;

describe("Autocomplete tests", () => {
  before(() => {
    //
  });

  it("1. JSObject this. autocomplete", () => {
    jsEditor.CreateJSObject(jsObjectBody);

    jsEditor.CreateJSObject("this.", {
      paste: false,
      completeReplace: false,
      toRun: false,
      shouldCreateNewJSObj: false,
    });
  });
});
