import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const explorer = require("../../../../locators/explorerlocators.json");

const {
  AggregateHelper: agHelper,
  CommonLocators,
  EntityExplorer,
  JSEditor: jsEditor,
} = ObjectsRegistry;

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
  before(() => {
    cy.get(explorer.addWidget).click();
    EntityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON_GROUP, 200, 200);
    EntityExplorer.DragDropWidgetNVerify(WIDGET.DOCUMENT_VIEWER, 200, 500);
  });

  it("1. ButtonGroup & Document viewer widget autocomplete & Eval shouldn't show up", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    const lineNumber = 5;
    cy.get(`:nth-child(${lineNumber}) > .CodeMirror-line`).click();

    // 1. Button group widget autocomplete verification
    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`ButtonGroup1.`);

    cy.get(`.CodeMirror-hints > :nth-child(1)`).contains("groupButtons");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`groupButtons.`);

    cy.get(`.CodeMirror-hints > :nth-child(1)`).contains("groupButton1");

    // 2. Document view widget autocomplete verification
    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("{backspace}".repeat("ButtonGroup1.groupButtons.".length)) // remove "ButtonGroup1.groupButtons."
      .wait(20)
      .type(`DocumentViewer1.`);
    agHelper.AssertElementText(CommonLocators._hints, "docUrl");

    // 3. Eval verification
    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("{backspace}".repeat("DocumentViewer1.".length)) // remove "ButtonGroup1.groupButtons."
      .wait(20)
      .type(`eval`);

    cy.get(`.CodeMirror-hints > :nth-child(1)`).should(
      "not.have.value",
      "eval()",
    );
  });

  it("2. Local variables autocompletion support", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    const lineNumber = 5;

    const array = [
      { label: "a", value: "b" },
      { label: "a", value: "b" },
    ];

    const codeToType = `
    const arr = ${JSON.stringify(array)};

    arr.map(callBack)
    `;

    // component re-render cause DOM element of cy.get to lost
    // added wait to finish re-render before cy.get
    cy.wait(100);

    cy.get(`:nth-child(${lineNumber}) > .CodeMirror-line`).click();

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`${codeToType}`, { parseSpecialCharSequences: false })
      .type(`{upArrow}{upArrow}`)
      .type(`const callBack = (item) => item.l`);

    cy.get(`.CodeMirror-hints > :nth-child(1)`).contains("label");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`label`);
  });

  it("3. JSObject this. autocomplete", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    const lineNumber = 5;

    const codeToType = "this.";

    cy.get(`:nth-child(${lineNumber}) > .CodeMirror-line`).click();

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`${codeToType}`);

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      cy.get(`.CodeMirror-hints > :nth-child(${index + 1})`).contains(element);
    });
  });
});
