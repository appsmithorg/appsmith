import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

const assertLintErrorAndOutput = (
  code: string,
  hasLintError: boolean,
  output?: string,
) => {
  jsEditor.EditJSObj(code);
  // Wait for parsing to be complete
  agHelper.Sleep(3000);

  hasLintError
    ? agHelper.AssertElementExist(locator._lintErrorElement)
    : agHelper.AssertElementAbsence(locator._lintErrorElement);

  if (output) {
    agHelper.GetNClick(jsEditor._runButton);
    cy.contains(
      output === "undefined" ? "did not return any data" : output,
    ).should("exist");
  }
};

describe("Correctly parses JS Function", () => {
  before(() => {
    ee.DragDropWidgetNVerify("singleselecttreewidget", 300, 500);
  });
  it("1. Preserves parenthesis in user's code", () => {
    const JS_OBJECT_BODY = `export default{
        labels: {
            filterText: "Expected result"
        },
            testFun: (searchText)=>{
                const filterText = searchText ?? (this.labels?.filterText + "s" || '');
  	return filterText;
            }
        }
        `;
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // confirm there is no parse error
    jsEditor.AssertParseError(false, false);
    // Wait for parsing to be complete
    agHelper.Sleep(2000);
    // run
    agHelper.GetNClick(jsEditor._runButton);

    // confirm there is no function execution error
    jsEditor.AssertParseError(false, false);

    cy.contains("Expected results").should("exist");
  });
  it("2. TC 1970 - Outputs expected result", () => {
    const getJSObjectBody = (expression: string) => `export default{
     myFun1: ()=>{
      const result = ${expression};
      return result;
     }
    } 
    `;
    const expression1 = `null ?? (TreeSelect1.selectedOptionLabel || undefined)`;
    const expression2 = `null ?? (TreeSelect1.selectedOptionLabel && undefined)`;
    const expression3 = `!null ?? (!TreeSelect1.selectedOptionLabel || !undefined)`;
    const expression4 = `null ?? (TreeSelect1.selectedOptionLabel.unknown || undefined)`;
    const expression5 = `null ?? (null || TreeSelect1.selectedOptionLabel + " hi")`;
    const expression6 = `null ?? (TreeSelect1.selectedOptionLabel || "hi")`;
    const expression7 = `null ?? (!TreeSelect1.selectedOptionLabel + " that" || "hi")`;
    const expression8 = `null ?? (TreeSelect1.selectedOptionLabel && "hi")`;
    const expression9 = `null ?? (TreeSelect1.selectedOptionLabel && undefined)`;
    const expression10 = `null ?? (!TreeSelect1.selectedOptionLabel && "hi")`;
    const expression11 = `(null || !TreeSelect1.selectedOptionLabel) ?? TreeSelect1.selectedOptionLabel.unknown`;
    const expression12 = `(null && !TreeSelect1.selectedOptionLabel) ?? "hi"`;
    const expression13 = `(true || "universe") ?? "hi"`;
    const expression14 = `null ?? TreeSelect1.selectedOptionLabel || undefined`;
    const expression15 = `null ?? TreeSelect1.selectedOptionLabel && undefined`;
    const expression16 = `!null ?? !TreeSelect1.selectedOptionLabel || !undefined`;
    const expression17 = `null ?? TreeSelect1.selectedOptionLabel || undefined`;

    assertLintErrorAndOutput(getJSObjectBody(expression1), false, "B");
    assertLintErrorAndOutput(getJSObjectBody(expression2), false, "B");
    assertLintErrorAndOutput(getJSObjectBody(expression3), false, "true");
    assertLintErrorAndOutput(getJSObjectBody(expression4), false, "undefined");
    assertLintErrorAndOutput(getJSObjectBody(expression5), false, "B hi");
    assertLintErrorAndOutput(getJSObjectBody(expression6), false, "hi");
    assertLintErrorAndOutput(getJSObjectBody(expression7), false, "false that");
    assertLintErrorAndOutput(getJSObjectBody(expression8), false, "hi");
    assertLintErrorAndOutput(getJSObjectBody(expression9), false, "hi");
    assertLintErrorAndOutput(getJSObjectBody(expression10), false, "hi");
    assertLintErrorAndOutput(getJSObjectBody(expression11), false, "false");
    assertLintErrorAndOutput(getJSObjectBody(expression12), false, "hi");
    assertLintErrorAndOutput(getJSObjectBody(expression13), false, "true");
    assertLintErrorAndOutput(getJSObjectBody(expression14), true, undefined);
    assertLintErrorAndOutput(getJSObjectBody(expression15), true, undefined);
    assertLintErrorAndOutput(getJSObjectBody(expression16), true, undefined);
    assertLintErrorAndOutput(getJSObjectBody(expression17), true, undefined);
  });
});
