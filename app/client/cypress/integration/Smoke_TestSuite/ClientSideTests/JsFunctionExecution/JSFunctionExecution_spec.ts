import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import largeJSONData from "../../../../fixtures/largeJSONData.json";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  table = ObjectsRegistry.Table,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JS Function Execution", function() {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

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

    // Assert presence of parse error callout (entire JS Object is invalid)
    jsEditor.AssertParseError(true, false);
  });
  it("4. Shows lint error and toast modal when JS Object doesn't start with 'export default'", () => {
    const invalidJSObjectStartToastMessage = "Start object with export default";
    const jsComment = "// This is a comment";
    const jsObjectStartLine = "export default{";
    const jsObjectStartingWithAComment = `${jsComment}
  ${jsObjectStartLine}
        fun1:()=>true
      }`;
    const jsObjectStartingWithASpace = ` ${jsObjectStartLine}
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
      agHelper.ValidateToastMessage(invalidJSObjectStartToastMessage);

      // Assert presence of lint error at the start line
      cy.get(locator._lintErrorElement)
        .should("exist")
        .should("contain.text", highlightedLintText);
    };

    assertInvalidJSObjectStart(jsObjectStartingWithAComment, jsComment);
    assertInvalidJSObjectStart(jsObjectStartingWithANewLine, jsObjectStartLine);
    assertInvalidJSObjectStart(jsObjectStartingWithASpace, jsObjectStartLine);
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
      jsEditor.EnterJSContext("Table Data", `{{${jsObjName}.largeData}}`);
    });

    // Deploy App and test that table loads properly
    agHelper.DeployApp();
    table.WaitUntilTableLoad();
    table.ReadTableRowColumnData(0, 1, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //validating id column value - row 0
      agHelper.NavigateBacktoEditor();
    });
  });

  it("6. Doesn't cause cyclic dependency when function name is edited", () => {
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
    agHelper.WaitUntilToastDisappear("created successfully");

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
    agHelper.WaitUntilToastDisappear("created successfully");
    // change async function name and test that cyclic dependency is not created
    jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction1);
    agHelper.AssertElementAbsence(locator._toastMsg);
    jsEditor.EditJSObj(asyncJSCodeWithRenamedFunction2);
    agHelper.AssertElementAbsence(locator._toastMsg);
  });
});
