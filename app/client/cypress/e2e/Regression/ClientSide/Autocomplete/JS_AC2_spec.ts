import {
  agHelper,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
} from "../../../../support/Objects/ObjectsCore";

let jsName: any;

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
  it("1. Bug #17059 Autocomplete does not suggest same function name that belongs to a different object", () => {
    // create js object - JSObject1
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // create js object - JSObject2
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "JSObject1.");

    agHelper.GetNAssertElementText(
      locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(locators._hints, "myFun1()", "have.text", 4);

    // Same check in JSObject1
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "JSObject2");
    agHelper.Sleep(500);
    agHelper.TypeText(locators._codeMirrorTextArea, ".");

    agHelper.GetNAssertElementText(
      locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(locators._hints, "myFun1()", "have.text", 4);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject2",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
  });

  it("2. Bug #10115 Autocomplete needs to show async await keywords instead of showing 'no suggestions'", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "aw");

    agHelper.GetNAssertElementText(locators._hints, "await", "have.text", 0);

    agHelper.RemoveCharsNType(locators._codeMirrorTextArea, 2, "as");
    agHelper.GetNAssertElementText(locators._hints, "async", "have.text", 0);
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("3. Bug #15429 Random keystrokes trigger autocomplete to show up", () => {
    // create js object & assert no hints just show up
    jsEditor.CreateJSObject(
      `export default
      myFunc1() {
        showAlert("Hello world");

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
    agHelper.AssertElementAbsence(locators._hints);

    //Paste the code and assert that the hints are not present
    jsEditor.CreateJSObject(
      `export default
      myFunc1() {
        showAlert("Hello world");

      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
        prettify: false,
      },
    );

    agHelper.AssertElementAbsence(locators._hints);

    agHelper.GetElement(jsEditor._lineinJsEditor(4)).click();
    agHelper.WaitUntilAllToastsDisappear();

    //Assert that hints are not present inside the string
    agHelper.TypeText(locators._codeMirrorTextArea, `const x = "`);

    agHelper.AssertElementAbsence(locators._hints);

    agHelper.SelectNRemoveLineText(jsEditor._lineinJsEditor(4));

    //Assert that hints are not present when line is cleared with backspace
    agHelper.AssertElementAbsence(locators._hints);

    //Assert that hints are not present when token is a comment
    agHelper.TypeText(locators._codeMirrorTextArea, "// showA'");

    agHelper.AssertElementAbsence(locators._hints);

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });
});
