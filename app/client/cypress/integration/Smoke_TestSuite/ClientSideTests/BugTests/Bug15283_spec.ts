import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Correctly parses JS Function", () => {
  it("Preserves parenthesis in user's code", () => {
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

    // run
    agHelper.GetNClick(jsEditor._runButton);

    // confirm there is no function execution error
    jsEditor.AssertParseError(false, false);

    cy.contains("Expected results").should("exist");
  });
});
