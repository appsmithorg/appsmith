import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

const jsObjectBody = `export default {
	myVar1: [],
	myVar2: {},
	myFun1(){

	},
	myFun2: async () => {
		//use async-await or promises
	}
}`;

describe("Verifies JS object rename bug", () => {
  it("Verify that a JS Object name is up for taking after it is deleted", () => {
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    jsEditor.RenameJSObjFromPane("JSObj2");

    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: EntityItems.JSObject,
    });

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    jsEditor.RenameJSObjFromPane("JSObj2");

    entityExplorer.AssertEntityPresenceInExplorer("JSObj2");
  });
});
