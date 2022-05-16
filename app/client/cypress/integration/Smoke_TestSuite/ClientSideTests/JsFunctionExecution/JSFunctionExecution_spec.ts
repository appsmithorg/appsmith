import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators;

describe("JS Function Execution", function() {
  it("1. Allows execution of js function when lint warnings(not errors) are present in code", function() {
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

    jsEditor.AssertParseError(false, false);
  });

  it("2. Prevents execution of js function when parse errors are present in code", function() {
    jsEditor.CreateJSObject(
      `export default {
  	myFun1: ()=>{
  		return "yes"
  	},
    myFun2: ()==>{}
  }`,
      true,
      true,
      false,
    );

    jsEditor.AssertParseError(true, false);
  });

  it("3. Allows execution of other JS functions when lint error is present in code one JS function", function() {
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

    jsEditor.AssertParseError(false, false);
  });

  it("4. Prioritizes parse errors that render JS Object invalid over function execution parse errors in debugger callouts", function() {
    const JSObjectWithFunctionExecutionParseErrors = `export default {
      myFun1:  (a ,b)=>{
      return f
      },
      myFun2 :()=>{
        return "yes"
      }
    }`;

    const JSObjectWithParseErrors = `export default {
      myFun1:  (a ,b)=>>{
      return f
      },
      myFun2 :()=>{
        return "yes"
      }
    }`;

    // create jsObject with parse error (that doesn't render JS Object invalid)
    jsEditor.CreateJSObject(
      JSObjectWithFunctionExecutionParseErrors,
      true,
      true,
      true,
    );

    // Assert presence of function execution parse error callout
    jsEditor.AssertParseError(true, true);
    // clear code
    cy.get(locator._codeMirrorTextArea)
      .first()
      .focus()
      .type(
        "{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}",
      )
      .type(
        "{shift}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}",
        { force: true },
      )
      .type("{backspace}", { force: true })
      // Add parse error that renders JS Object invalid in code
      .type(JSObjectWithParseErrors, {
        parseSpecialCharSequences: false,
        delay: 150,
        force: true,
      });
    // Assert presence of parse error callout (entire JS Object is invalid)
    jsEditor.AssertParseError(true, false);
  });
});
