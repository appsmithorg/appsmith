import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import largeJSONData from "../../../../fixtures/largeJSONData.json";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.Table,
  agHelper = ObjectsRegistry.AggregateHelper,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

let onPageLoadAndConfirmExecuteFunctionsLength: number,
  getJSObject: any,
  functionsLength: number,
  jsObj: string;

describe("JS Function Execution", function() {
  interface IFunctionSettingData {
    name: string;
    onPageLoad: boolean;
    confirmBeforeExecute: boolean;
  }
  const FUNCTIONS_SETTINGS_DEFAULT_DATA: IFunctionSettingData[] = [
    {
      name: "getId",
      onPageLoad: true,
      confirmBeforeExecute: false,
    },
    {
      name: "zip",
      onPageLoad: true,
      confirmBeforeExecute: true,
    },
    {
      name: "base",
      onPageLoad: false,
      confirmBeforeExecute: false,
    },
    {
      name: "assert",
      onPageLoad: false,
      confirmBeforeExecute: false,
    },
    {
      name: "test",
      onPageLoad: true,
      confirmBeforeExecute: true,
    },
  ];

  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("explorer");
  });
  function assertAsyncFunctionsOrder(data: IFunctionSettingData[]) {
    // sorts functions alphabetically
    const sortFunctions = (data: IFunctionSettingData[]) =>
      data.sort((a, b) => a.name.localeCompare(b.name));
    cy.get(jsEditor._asyncJSFunctionSettings).then(function($lis) {
      const asyncFunctionLength = $lis.length;
      // Assert number of async functions
      expect(asyncFunctionLength).to.equal(functionsLength);
      Object.values(sortFunctions(data)).forEach((functionSetting, idx) => {
        // Assert alphabetical order
        expect($lis.eq(idx)).to.have.id(
          jsEditor._getJSFunctionSettingsId(functionSetting.name),
        );
      });
    });
  }

  it("1. Allows execution of js function when lint warnings(not errors) are present in code", function() {
    jsEditor.CreateJSObject(
      `export default {
  	myFun1: ()=>{
  		f;
  		return "yes"
  	}
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.AssertParseError(false, false);
    agHelper.ActionContextMenuWithInPane("Delete", "", true);
  });

  it("2. Prevents execution of js function when parse errors are present in code", function() {
    jsEditor.CreateJSObject(
      `export default {
  	myFun1: ()=>>{
  		return "yes"
  	}
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.AssertParseError(true, false);
    agHelper.ActionContextMenuWithInPane("Delete", "", true);
  });

  it("3. Prioritizes parse errors that render JS Object invalid over function execution parse errors in debugger callouts", function() {
    const JSObjectWithFunctionExecutionParseErrors = `export default {
      myFun1 :()=>{
        return f
      }
    }`;

    const JSObjectWithParseErrors = `export default {
      myFun1:  (a ,b)=>>{
      return "yes"
      }
    }`;

    // create jsObject with parse error (that doesn't render JS Object invalid)
    jsEditor.CreateJSObject(JSObjectWithFunctionExecutionParseErrors, {
      paste: true,
      completeReplace: true,
      toRun: true,
      shouldCreateNewJSObj: true,
    });

    // Assert presence of function execution parse error callout
    jsEditor.AssertParseError(true, true);

    // Add parse error that renders JS Object invalid in code
    jsEditor.CreateJSObject(JSObjectWithParseErrors, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: false,
    });

    agHelper.Sleep(2000); // Giving more time for parsing to reduce flakiness!

    // Assert presence of parse error callout (entire JS Object is invalid)
    jsEditor.AssertParseError(true, false);
    agHelper.ActionContextMenuWithInPane("Delete", "", true);
  });

  it("4. Shows lint error and toast modal when JS Object doesn't start with 'export default'", () => {
    const invalidJSObjectStartToastMessage = "Start object with export default";
    const jsComment = "// This is a comment";
    const jsObjectStartLine = "export default{";
    const jsObjectStartLineWithSpace = `export  default{`;
    const jsObjectStartingWithAComment = `${jsComment}
  ${jsObjectStartLine}
        fun1:()=>true
      }`;
    const jsObjectStartingWithASpace = `${jsObjectStartLineWithSpace}
        fun1:()=>true
      }`;

    const jsObjectStartingWithANewLine = `
  ${jsObjectStartLine}
        fun1:()=>true
      }`;

    const assertInvalidJSObjectStart = (
      jsCode: string,
      highlightedLintText: string,
    ) => {
      // create jsObject that doesn't start with 'export default'
      jsEditor.CreateJSObject(jsCode, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      });
      // Assert presence of toast message
      agHelper.WaitUntilToastDisappear(invalidJSObjectStartToastMessage);

      // Assert presence of lint error at the start line
      cy.get(locator._lintErrorElement)
        .should("exist")
        .should("contain.text", highlightedLintText);
      agHelper.ActionContextMenuWithInPane("Delete", "", true);
    };

    assertInvalidJSObjectStart(jsObjectStartingWithAComment, jsComment);
    assertInvalidJSObjectStart(jsObjectStartingWithANewLine, jsObjectStartLine);
    assertInvalidJSObjectStart(
      jsObjectStartingWithASpace,
      jsObjectStartLineWithSpace,
    );
  });

  it("5. Verify that js function execution errors are logged in debugger and removed when function is deleted", () => {
    const JS_OBJECT_WITH_PARSE_ERROR = `export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        //write code here
        return Table1.unknown.name
      }
    }`;

    const JS_OBJECT_WITHOUT_PARSE_ERROR = `export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        //write code here
        return Table1.unknown
      }
    }`;

    const JS_OBJECT_WITH_DELETED_FUNCTION = `export default {
      myVar1: [],
      myVar2: {}
    }`;

    // Create js object
    jsEditor.CreateJSObject(JS_OBJECT_WITH_PARSE_ERROR, {
      paste: true,
      completeReplace: true,
      toRun: true,
      shouldCreateNewJSObj: true,
    });

    // Assert that there is a function execution parse error
    jsEditor.AssertParseError(true, true);
    // click the debug icon
    agHelper.GetNClick(jsEditor._debugCTA);
    // Assert that errors tab is not empty
    cy.contains("No signs of trouble here!").should("not.exist");
    // Assert presence of typeError
    cy.contains(
      "TypeError: Cannot read properties of undefined (reading 'name')",
    ).should("exist");

    // Fix parse error and assert that debugger error is removed
    jsEditor.EditJSObj(JS_OBJECT_WITHOUT_PARSE_ERROR);
    agHelper.GetNClick(jsEditor._runButton);
    jsEditor.AssertParseError(false, true);
    agHelper.GetNClick(locator._errorTab);
    cy.contains(
      "TypeError: Cannot read properties of undefined (reading 'name')",
    ).should("not.exist");

    // Switch back to response tab
    agHelper.GetNClick(locator._responseTab);
    // Re-introduce parse errors
    jsEditor.EditJSObj(JS_OBJECT_WITH_PARSE_ERROR);
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.WaitUntilToastDisappear("ran successfully"); //to not hinder with next toast msg in next case!
    // Assert that there is a function execution parse error
    jsEditor.AssertParseError(true, true);

    // Delete function
    jsEditor.EditJSObj(JS_OBJECT_WITH_DELETED_FUNCTION);
    // Assert that parse error is removed from debugger when function is deleted
    agHelper.GetNClick(locator._errorTab);
    cy.contains(
      "TypeError: Cannot read properties of undefined (reading 'name')",
    ).should("not.exist");
  });

  it("6. Supports the use of large JSON data (doesn't crash)", () => {
    const jsObjectWithLargeJSONData = `export default{
      largeData: ${JSON.stringify(largeJSONData)},
      myfun1: ()=> this.largeData
    }`;
    const crashMessage = "Oops! Something went wrong";
    // create jsObject with large json data and run
    jsEditor.CreateJSObject(jsObjectWithLargeJSONData, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // wait for 3 secs and assert that App doesn't crash
    cy.wait(3000);
    cy.contains(crashMessage).should("not.exist");

    // Edit JSObject and run
    jsEditor.CreateJSObject(" ", {
      paste: true,
      completeReplace: false,
      toRun: true,
      shouldCreateNewJSObj: false,
    });

    cy.get("@jsObjName").then((jsObjName) => {
      ee.SelectEntityByName("Table1", "WIDGETS");
      propPane.UpdatePropertyFieldValue(
        "Table Data",
        `{{${jsObjName}.largeData}}`,
      );
    });

    // Deploy App and test that table loads properly
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(0, 1, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //validating id column value - row 0
      deployMode.NavigateBacktoEditor();
    });
  });

  it("7. Doesn't cause cyclic dependency when function name is edited", () => {
    const syncJSCode = `export default {
      myFun1 :()=>{
        return "yes"
      }
    }`;

    const syncJSCodeWithRenamedFunction1 = `export default {
      myFun2 :()=>{
        return "yes"
      }
    }`;

    const syncJSCodeWithRenamedFunction2 = `export default {
      myFun3 :()=>{
        return "yes"
      }
    }`;

    const asyncJSCode = `export default {
      myFun1 :async ()=>{
        return "yes"
      }
    }`;

    const asyncJSCodeWithRenamedFunction1 = `export default {
      myFun2 :async ()=>{
        return "yes"
      }
    }`;

    const asyncJSCodeWithRenamedFunction2 = `export default {
      myFun3 :async ()=>{
        return "yes"
      }
    }`;

    jsEditor.CreateJSObject(syncJSCode, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // change sync function name and test that cyclic dependency is not created
    jsEditor.EditJSObj(syncJSCodeWithRenamedFunction1);
    agHelper.AssertElementAbsence(locator._toastMsg);
    jsEditor.EditJSObj(syncJSCodeWithRenamedFunction2);
    agHelper.AssertElementAbsence(locator._toastMsg);

    jsEditor.CreateJSObject(asyncJSCode, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    // change async function name and test that cyclic dependency is not created
    jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction1);
    agHelper.AssertElementAbsence(locator._toastMsg);
    jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction2);
    agHelper.AssertElementAbsence(locator._toastMsg);
  });

  it("8. Maintains order of async functions in settings tab alphabetically at all times", function() {
    functionsLength = FUNCTIONS_SETTINGS_DEFAULT_DATA.length;
    // Number of functions set to run on page load and should also confirm before execute
    onPageLoadAndConfirmExecuteFunctionsLength = FUNCTIONS_SETTINGS_DEFAULT_DATA.filter(
      (func) => func.onPageLoad && func.confirmBeforeExecute,
    ).length;

    getJSObject = (data: IFunctionSettingData[]) => {
      let JS_OBJECT_BODY = `export default`;
      for (let i = 0; i < functionsLength; i++) {
        const functionName = data[i].name;
        JS_OBJECT_BODY +=
          i === 0
            ? `{
              ${functionName}: async ()=>"${functionName}",`
            : i === functionsLength - 1
            ? `
            ${functionName}: async ()=>"${functionName}",
          }`
            : `
            ${functionName}: async ()=> "${functionName}",`;
      }
      return JS_OBJECT_BODY;
    };

    // Create js object
    jsEditor.CreateJSObject(getJSObject(FUNCTIONS_SETTINGS_DEFAULT_DATA), {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.get("@jsObjName").then((jsObjName: any) => {
      jsObj = jsObjName;
    });
    // Switch to settings tab
    agHelper.GetNClick(jsEditor._settingsTab);
    // Add settings for each function (according to data)
    Object.values(FUNCTIONS_SETTINGS_DEFAULT_DATA).forEach(
      (functionSetting) => {
        jsEditor.EnableDisableAsyncFuncSettings(
          functionSetting.name,
          functionSetting.onPageLoad,
          functionSetting.confirmBeforeExecute,
        );
      },
    );
    // Switch to settings tab
    agHelper.GetNClick(jsEditor._settingsTab);
    //After JSObj is created - check methods are in alphabetical order
    assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);

    agHelper.RefreshPage();
    // click "Yes" button for all onPageload && ConfirmExecute functions
    for (let i = 0; i <= onPageLoadAndConfirmExecuteFunctionsLength - 1; i++) {
      //agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog")); // Not working in edit mode
      agHelper.ClickButton("Yes");
      agHelper.Sleep();
    }
    // Switch to settings tab and assert order
    agHelper.GetNClick(jsEditor._settingsTab);
    assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);
  });

  it("9. Verify Async methods have alphabetical order after cloning page and renaming it", () => {
    const FUNCTIONS_SETTINGS_RENAMED_DATA: IFunctionSettingData[] = [
      {
        name: "newGetId",
        onPageLoad: true,
        confirmBeforeExecute: false,
      },
      {
        name: "zip1",
        onPageLoad: true,
        confirmBeforeExecute: true,
      },
      {
        name: "base",
        onPageLoad: false,
        confirmBeforeExecute: false,
      },
      {
        name: "newAssert",
        onPageLoad: true,
        confirmBeforeExecute: false,
      },
      {
        name: "test",
        onPageLoad: true,
        confirmBeforeExecute: true,
      },
    ];

    // clone page and assert order of functions
    ee.ClonePage();
    // click "Yes" button for all onPageload && ConfirmExecute functions
    for (let i = 0; i <= onPageLoadAndConfirmExecuteFunctionsLength - 1; i++) {
      //agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog")); // Not working in edit mode
      agHelper.ClickButton("Yes");
      agHelper.Sleep();
    }

    ee.SelectEntityByName(jsObj, "QUERIES/JS");

    agHelper.GetNClick(jsEditor._settingsTab);
    assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);

    // rename functions and assert order
    agHelper.GetNClick(jsEditor._codeTab);
    jsEditor.EditJSObj(getJSObject(FUNCTIONS_SETTINGS_RENAMED_DATA));
    cy.wait(3000);
    agHelper.GetNClick(jsEditor._settingsTab);
    assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_RENAMED_DATA);
  });

  it("10. Bug 13197: Verify converting async functions to sync resets all settings", () => {
    const asyncJSCode = `export default {
      myFun1 : async ()=>{
        return "yes"
      }
    }`;

    const syncJSCode = `export default {
      myFun1 : ()=>{
        return "yes"
      }
    }`;

    jsEditor.CreateJSObject(asyncJSCode, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // Switch to settings tab
    agHelper.GetNClick(jsEditor._settingsTab);
    // Enable all settings
    jsEditor.EnableDisableAsyncFuncSettings("myFun1", true, true);

    // Modify js object
    jsEditor.EditJSObj(syncJSCode);

    agHelper.RefreshPage();
    cy.wait("@jsCollections").then(({ response }) => {
      expect(response?.body.data.actions[0].executeOnLoad).to.eq(false);
      expect(response?.body.data.actions[0].confirmBeforeExecute).to.eq(false);
    });
  });
});
