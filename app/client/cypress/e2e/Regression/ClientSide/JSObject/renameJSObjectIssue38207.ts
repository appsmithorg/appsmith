import { jsEditor } from "../../../../support/Objects/ObjectsCore";

describe(
  "To test [Bug]: Action redesign: Focus shifts to another tab when renaming a JSObject #38207",
  { tags: ["@tag.JS"] },
  () => {
    it("1. Validate that focus does not shift to another tab while renaming JS Object", () => {
      // Create first JS file
      jsEditor.CreateJSObject(
        `export default {
	                myVar1: [],
	                myVar2: {},
	                myFun1 () {
		                //	write code here
		                //	this.myVar1 = [1,2,3]
	                },
	                async myFun2 () {
		                //	use async-await or promises
		                //	await storeValue('varName', 'hello world')
	                }
                }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
        },
      );

      // Create second JS file
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });

      // Create third JS file
      jsEditor.CreateJSObject("", { prettify: false, toRun: false });
      jsEditor.RenameJSObjFromPane("ChangedName");

      cy.get(jsEditor.listOfJsObjects).eq(2).contains("ChangedName");
    });
  },
);
