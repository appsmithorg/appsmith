import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JSEditor Comment - Visual tests", { tags: ["@tag.Visual"] }, () => {
  it("1. comments code on the editor", () => {
    jsEditor.CreateJSObject(
      `export default {
  myFun1: () => {
    function hi(a,b) {
      console.log(a,b);
    }
    hi(1,2);
  },
  myFun2: async () => {
    //use async-await or promises
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

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjBeforeCommenting1");

    // Comment out lines 2,3,4
    for (let i = 2; i < 5; i++) {
      agHelper.GetNClick(jsEditor._lineinJsEditor(i), 0, true);

      agHelper.Sleep(100);

      cy.get(jsEditor._lineinJsEditor(i)).type(
        agHelper.isMac ? "{meta} /" : "{ctrl} /",
      );
      agHelper.Sleep(500);
    }

    // Allow time to comment out lines
    agHelper.Sleep(1000);

    cy.get("div.CodeMirror").matchImageSnapshot("jsObjAfterCommenting1");
  });
});
