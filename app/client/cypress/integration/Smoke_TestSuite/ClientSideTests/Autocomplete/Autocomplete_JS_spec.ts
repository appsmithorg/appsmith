import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const { JSEditor: jsEditor } = ObjectsRegistry;

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
    //
  });

  it("1. JSObject this. autocomplete", () => {
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

    cy.get(".CodeMirror textarea")
      .focus()
      .type(`${codeToType}`);

    ["myFun1()", "myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      cy.get(`.CodeMirror-hints > :nth-child(${index + 1})`).contains(element);
    });
  });
});
