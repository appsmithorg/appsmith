import largeJSONData from "../../../../fixtures/largeJSONData.json";
import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  deployMode,
  table,
  debuggerHelper,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

interface IFunctionSettingData {
  name: string;
  onPageLoad: boolean;
  confirmBeforeExecute: boolean;
  // uses the "async" keyword
  isMarkedAsync: boolean;
}

let onPageLoadAndConfirmExecuteFunctionsLength: number,
  getJSObject: (data: IFunctionSettingData[]) => string,
  functionsLength: number,
  jsObj: string;

describe(
  "JS Function Execution",
  { tags: ["@tag.JS", "@tag.Sanity", "@tag.Binding"] },
  function () {
    const FUNCTIONS_SETTINGS_DEFAULT_DATA: IFunctionSettingData[] = [
      {
        name: "getId",
        onPageLoad: true,
        confirmBeforeExecute: false,
        isMarkedAsync: true,
      },
      {
        name: "zip",
        onPageLoad: true,
        confirmBeforeExecute: true,
        isMarkedAsync: false,
      },
      {
        name: "base",
        onPageLoad: false,
        confirmBeforeExecute: false,
        isMarkedAsync: true,
      },
      {
        name: "assert",
        onPageLoad: false,
        confirmBeforeExecute: false,
        isMarkedAsync: false,
      },
      {
        name: "test",
        onPageLoad: true,
        confirmBeforeExecute: true,
        isMarkedAsync: true,
      },
    ];

    before(() => {
      agHelper.AddDsl("tablev1NewDsl");
    });

    function assertAsyncFunctionsOrder(data: IFunctionSettingData[]) {
      // sorts functions alphabetically
      const sortFunctions = (data: IFunctionSettingData[]) =>
        data.sort((a, b) => a.name.localeCompare(b.name));
      cy.get(jsEditor._asyncJSFunctionSettings).then(function ($lis) {
        const asyncFunctionLength = $lis.length;
        // Assert number of functions
        expect(asyncFunctionLength).to.equal(functionsLength);
        Object.values(sortFunctions(data)).forEach((functionSetting, idx) => {
          // Assert alphabetical order
          expect($lis.eq(idx)).to.have.id(
            jsEditor._getJSFunctionSettingsId(functionSetting.name),
          );
        });
      });
    }

    it("1. Allows execution of js function when lint warnings(not errors) are present in code", function () {
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
          prettify: false,
        },
      );

      jsEditor.AssertParseError(false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("2. Prevents execution of js function when parse errors are present in code", function () {
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
          prettify: false,
        },
      );
      //Debugger shouldn't open when there is a parse error.
      //It should open only in case of execution error.
      debuggerHelper.AssertClosed();
      //Verify there is no error shown in the response tab.
      debuggerHelper.OpenDebugger();
      debuggerHelper.ClickResponseTab();
      jsEditor.AssertParseError(false);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("3. Prioritizes parse errors that render JS Object invalid over function execution parse errors in debugger callouts", function () {
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
        prettify: false,
      });

      // Assert presence of function execution parse error callout
      jsEditor.AssertParseError(true);

      // Add parse error that renders JS Object invalid in code
      jsEditor.CreateJSObject(JSObjectWithParseErrors, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
        prettify: false,
      });

      agHelper.Sleep(2000); // Giving more time for parsing to reduce flakiness!

      // Assert presence of parse error callout (entire JS Object is invalid)
      jsEditor.AssertParseError(true);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("4. Shows lint error and toast modal when JS Object doesn't start with 'export default'", () => {
      const invalidJSObjectStartToastMessage =
        "Start object with export default";
      const jsComment = "// This is a comment";
      const jsObjectStartLine = `export default{`;
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
        agHelper.AssertContains(invalidJSObjectStartToastMessage);

        // Assert presence of lint error at the start line
        agHelper.GetNAssertElementText(
          locators._lintErrorElement,
          highlightedLintText,
          "contain.text",
          -1,
        );
        agHelper.WaitUntilAllToastsDisappear();
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.JSObject,
        });
      };
      assertInvalidJSObjectStart(jsObjectStartingWithAComment, jsComment);
      assertInvalidJSObjectStart(
        jsObjectStartingWithANewLine,
        jsObjectStartLine,
      );
      assertInvalidJSObjectStart(
        jsObjectStartingWithASpace,
        jsObjectStartLineWithSpace,
      );
    });

    it("5. Supports the use of large JSON data (doesn't crash)", () => {
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
      agHelper.Sleep(3000);
      agHelper.AssertContains(crashMessage, "not.exist");

      // Edit JSObject and run
      jsEditor.CreateJSObject(" ", {
        paste: true,
        completeReplace: false,
        toRun: true,
        shouldCreateNewJSObj: false,
      });

      cy.get("@jsObjName").then((jsObjName) => {
        EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
        propPane.UpdatePropertyFieldValue(
          "Table data",
          `{{${jsObjName}.largeData}}`,
        );
      });

      // Deploy App and test that table loads properly
      deployMode.DeployApp();
      table.WaitUntilTableLoad();
      table.ReadTableRowColumnData(0, 1, "v1", 2000).then(($cellData) => {
        expect($cellData).to.eq("1"); //validating id column value - row 0
        deployMode.NavigateBacktoEditor();
      });
      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("6. Doesn't cause cyclic dependency when function name is edited", () => {
      const syncJSCode = `export default {
      myFun1 :()=>{
        return "yes"`;

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
        return "yes"`;

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
        paste: false,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });

      // change sync function name and test that cyclic dependency is not created
      jsEditor.EditJSObj(syncJSCodeWithRenamedFunction1, false);
      agHelper.AssertContains("Cyclic dependency", "not.exist");
      jsEditor.EditJSObj(syncJSCodeWithRenamedFunction2, false);
      agHelper.AssertContains("Cyclic dependency", "not.exist");

      jsEditor.CreateJSObject(asyncJSCode, {
        paste: false,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });
      // change function name and test that cyclic dependency is not created
      jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction1, false);
      agHelper.AssertContains("Cyclic dependency", "not.exist");
      jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction2, false);
      agHelper.AssertContains("Cyclic dependency", "not.exist");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("7. Maintains order of functions in settings tab alphabetically at all times", function () {
      functionsLength = FUNCTIONS_SETTINGS_DEFAULT_DATA.length;
      // Number of functions set to run on page load and should also confirm before execute
      onPageLoadAndConfirmExecuteFunctionsLength =
        FUNCTIONS_SETTINGS_DEFAULT_DATA.filter(
          (func) => func.onPageLoad && func.confirmBeforeExecute,
        ).length;

      getJSObject = (data: IFunctionSettingData[]) => {
        let JS_OBJECT_BODY = `export default`;
        for (let i = 0; i < functionsLength; i++) {
          const functionName = data[i].name;
          const isMarkedAsync = data[i].isMarkedAsync;
          JS_OBJECT_BODY +=
            i === 0
              ? `{
              ${functionName}: ${
                isMarkedAsync ? "async" : ""
              } ()=>"${functionName}",`
              : i === functionsLength - 1
                ? `
            ${functionName}: ${
              isMarkedAsync ? "async" : ""
            } ()=>"${functionName}",
          }`
                : `
            ${functionName}: ${
              isMarkedAsync ? "async" : ""
            } ()=> "${functionName}",`;
        }
        return JS_OBJECT_BODY;
      };

      // Create js object
      jsEditor.CreateJSObject(getJSObject(FUNCTIONS_SETTINGS_DEFAULT_DATA), {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });

      cy.get("@jsObjName").then((jsObjName: any) => {
        jsObj = jsObjName;
      });
      // Add settings for each function (according to data)
      Object.values(FUNCTIONS_SETTINGS_DEFAULT_DATA).forEach(
        (functionSetting) => {
          jsEditor.EnableDisableAsyncFuncSettings(
            functionSetting.name,
            functionSetting.onPageLoad,
          );
        },
      );

      // open settings popup
      jsEditor.toolbar.toggleSettings();
      //After JSObj is created - check methods are in alphabetical order
      assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);

      agHelper.RefreshPage();
      agHelper.Sleep(2000); //for confirmatiom modal to appear before clicking on "Yes" button for CI runs
      // open settings popup
      jsEditor.toolbar.toggleSettings();
      assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);
    });

    it("8. Verify Async methods have alphabetical order after cloning page and renaming it", () => {
      const FUNCTIONS_SETTINGS_RENAMED_DATA: IFunctionSettingData[] = [
        {
          name: "newGetId",
          onPageLoad: true,
          confirmBeforeExecute: false,
          isMarkedAsync: false,
        },
        {
          name: "zip1",
          onPageLoad: true,
          confirmBeforeExecute: true,
          isMarkedAsync: true,
        },
        {
          name: "base",
          onPageLoad: false,
          confirmBeforeExecute: false,
          isMarkedAsync: true,
        },
        {
          name: "newAssert",
          onPageLoad: true,
          confirmBeforeExecute: false,
          isMarkedAsync: false,
        },
        {
          name: "test",
          onPageLoad: true,
          confirmBeforeExecute: true,
          isMarkedAsync: true,
        },
      ];

      // clone page and assert order of functions
      PageList.ClonePage();
      agHelper.Sleep();
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.Sleep();

      EditorNavigation.SelectEntityByName(jsObj, EntityType.JSObject);

      jsEditor.toolbar.toggleSettings();
      assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_DEFAULT_DATA);

      // rename functions and assert order
      jsEditor.toolbar.toggleSettings();
      jsEditor.EditJSObj(getJSObject(FUNCTIONS_SETTINGS_RENAMED_DATA), false);
      agHelper.Sleep(3000);
      jsEditor.toolbar.toggleSettings();
      assertAsyncFunctionsOrder(FUNCTIONS_SETTINGS_RENAMED_DATA);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("9. Bug 13197: Verify converting async functions to sync doesn't reset all settings", () => {
      const asyncJSCode = `export default {
name: "Appsmith",
asyncToSync : async ()=>{
return "yes";`;

      const syncJSCode = `export default {
      name: "Appsmith",
      asyncToSync : ()=>{
        return "yes";
      },
    }`;

      jsEditor.CreateJSObject(asyncJSCode, {
        paste: false,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });

      // Enable all settings
      jsEditor.EnableDisableAsyncFuncSettings("asyncToSync", true);

      // Modify js object
      jsEditor.EditJSObj(syncJSCode, false);
      agHelper.RefreshPage();
      jsEditor.VerifyAsyncFuncSettings("asyncToSync", true);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });

    it("10. Verify that js function execution errors are logged in debugger and removed when function is deleted", () => {
      const JS_OBJECT_WITH_PARSE_ERROR = `export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        return Table1.unknown.id`;

      const JS_OBJECT_WITHOUT_PARSE_ERROR = `export default {
      myVar1: [],
      myVar2: {},
      myFun1: () => {
        return Table1.unknown
      }
    }`;

      const JS_OBJECT_WITH_DELETED_FUNCTION = `export default {
      myVar1: [],
      myVar2: {}
    }`;

      // Create js object
      jsEditor.CreateJSObject(JS_OBJECT_WITH_PARSE_ERROR, {
        paste: false,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
      });

      // Assert that there is a function execution parse error
      jsEditor.AssertParseError(true);
      // Assert that response tab is not empty
      agHelper.AssertContains("No signs of trouble here!", "not.exist");
      // Assert presence of typeError in response tab
      agHelper.AssertContains('"Table1.unknown" is undefined', "exist");
      agHelper.AssertContains("TypeError", "exist");

      // click the error tab
      agHelper.GetNClick(locators._errorTab);
      // Assert that errors tab is not empty
      agHelper.AssertContains("No signs of trouble here!", "not.exist");
      // Assert presence of typeError in error tab
      agHelper.AssertContains('"Table1.unknown" is undefined', "exist");
      agHelper.AssertContains("TypeError", "exist");

      // Fix parse error and assert that debugger error is removed
      jsEditor.EditJSObj(JS_OBJECT_WITHOUT_PARSE_ERROR, true, false);
      agHelper.RefreshPage();
      jsEditor.RunJSObj();
      //agHelper.AssertContains("ran successfully"); //commenting since 'Resource not found' comes sometimes due to fast parsing
      agHelper.AssertElementAbsence(locators._btnSpinner, 10000);
      agHelper.GetNClick(locators._errorTab);
      agHelper.AssertContains('"Table1.unknown" is undefined', "not.exist");

      // Switch back to response tab
      agHelper.GetNClick(locators._responseTab);
      // Re-introduce parse errors
      jsEditor.EditJSObj(JS_OBJECT_WITH_PARSE_ERROR + "}}", false, false);
      jsEditor.RunJSObj();
      // Assert that there is a function execution parse error
      jsEditor.AssertParseError(true);

      // Delete function
      jsEditor.EditJSObj(JS_OBJECT_WITH_DELETED_FUNCTION, true, false);
      // Assert that parse error is removed from debugger when function is deleted
      agHelper.GetNClick(locators._errorTab);
      agHelper.AssertContains('"Table1.unknown" is undefined.', "not.exist");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  },
);
