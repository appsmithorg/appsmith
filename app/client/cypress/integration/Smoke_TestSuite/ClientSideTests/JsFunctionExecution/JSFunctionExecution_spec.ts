import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import largeJSONData from "../../../../fixtures/largeJSONData.json";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer;

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
        shouldNavigate: true,
      });

      // Assert presence of toast message
      cy.get(locator._toastMsg)
        .should("exist")
        .should("contain.text", invalidJSObjectStartToastMessage);

      // Assert presence of lint error at the start line
      cy.get(locator._lintErrorElement)
        .should("exist")
        .should("have.text", highlightedLintText);
    };

    assertInvalidJSObjectStart(jsObjectStartingWithAComment, jsComment);
    assertInvalidJSObjectStart(jsObjectStartingWithANewLine, jsObjectStartLine);
    assertInvalidJSObjectStart(
      jsObjectStartingWithASpace,
      ` ${jsObjectStartLine}`,
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
      shouldNavigate: true,
    });

    // wait for 3 secs and assert that App doesn't crash
    cy.wait(3000);
    cy.contains(crashMessage).should("not.exist");

    // Edit JSObject and run
    jsEditor.CreateJSObject(" ", {
      paste: true,
      completeReplace: false,
      toRun: true,
      shouldNavigate: false,
    });

    cy.get("@jsObjName").then((jsObjName) => {
      ee.SelectEntityByName("Table1", "WIDGETS");
      jsEditor.EnterJSContext("Table Data", `{{${jsObjName}.largeData}}`);
    });
  });
});
