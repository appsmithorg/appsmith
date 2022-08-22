import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const explorer = require("../../../../locators/explorerlocators.json");

const {
  AggregateHelper: agHelper,
  ApiPage,
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
  it("1. Verify widgets autocomplete: ButtonGroup & Document viewer widget", () => {
    cy.get(explorer.addWidget).click();
    EntityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON_GROUP, 200, 200);
    EntityExplorer.DragDropWidgetNVerify(WIDGET.DOCUMENT_VIEWER, 200, 500);

    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // focus on 5th line
    cy.get(`:nth-child(5) > .CodeMirror-line`).click();

    // 1. Button group widget autocomplete verification
    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`ButtonGroup1.`);

    agHelper.AssertElementText(CommonLocators._hints, "groupButtons");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`groupButtons.`);

    agHelper.AssertElementText(CommonLocators._hints, "groupButton1");

    // 2. Document view widget autocomplete verification
    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("{backspace}".repeat("ButtonGroup1.groupButtons.".length)) // remove "ButtonGroup1.groupButtons."
      .wait(20)
      .type(`DocumentViewer1.`);

    agHelper.AssertElementText(CommonLocators._hints, "docUrl");
  });

  it("2. Verify browser JavaScript APIs in autocomplete ", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // focus on 5th line
    cy.get(`:nth-child(5) > .CodeMirror-line`).click();

    const JSAPIsToTest = [
      // console API verification
      {
        type: "console",
        expected: "console",
        shouldBePresent: true,
      },
      // crypto API verification
      {
        type: "crypto",
        expected: "crypto",
        shouldBePresent: true,
      },
      // eval function verification
      {
        type: "eval",
        expected: "eval()",
        shouldBePresent: false,
      },
      {
        type: "Blob",
        expected: "Blob()",
        shouldBePresent: true,
      },
      {
        type: "FormData",
        expected: "FormData()",
        shouldBePresent: true,
      },
      {
        type: "FileReader",
        expected: "FileReader()",
        shouldBePresent: true,
      },
    ];

    JSAPIsToTest.forEach((test, index) => {
      const deleteCharCount = (JSAPIsToTest[index - 1]?.type || " ").length;
      cy.get(CommonLocators._codeMirrorTextArea)
        .focus()
        // remove previously typed code
        .type(deleteCharCount ? "{backspace}".repeat(deleteCharCount) : " ")
        .wait(20)
        .type(test.type);

      cy.get(CommonLocators._hints)
        .eq(0)
        .should(
          test.shouldBePresent ? "have.text" : "not.have.text",
          test.expected,
        );
    });
  });

  it("3. JSObject this. autocomplete", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    // focus on 5th line
    cy.get(`:nth-child(5) > .CodeMirror-line`).click();

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("this.");

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      cy.get(`.CodeMirror-hints > :nth-child(${index + 1})`).contains(element);
    });
  });

  it("4. Local variables & complex data autocompletion test", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    const lineNumber = 5;

    const users = [
      { label: "a", value: "b" },
      { label: "a", value: "b" },
    ];

    const codeToType = `
    const users = ${JSON.stringify(users)};
    const data = { userCollection: [{ users }, { users }] };

    users.map(callBack)
    `;

    // component re-render cause DOM element of cy.get to lost
    // added wait to finish re-render before cy.get
    cy.wait(100);

    cy.get(`:nth-child(${lineNumber}) > .CodeMirror-line`).click();

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`${codeToType}`, { parseSpecialCharSequences: false })
      .type(`{upArrow}{upArrow}`)
      .type(`const callBack = (user) => user.l`);

    agHelper.AssertElementText(CommonLocators._hints, "label");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`abel;`);

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`data.`);

    agHelper.AssertElementText(CommonLocators._hints, "userCollection");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`userCollection[0].`);

    agHelper.AssertElementText(CommonLocators._hints, "users");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type(`users[0].`);

    agHelper.AssertElementText(CommonLocators._hints, "label");
  });

  it("5. Api data with array of object autocompletion test", () => {
    ApiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    ApiPage.RunAPI();
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    cy.get(`:nth-child(${5}) > .CodeMirror-line`).click();

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("Api1.data.u");

    agHelper.AssertElementText(CommonLocators._hints, "users");

    cy.get(CommonLocators._codeMirrorTextArea)
      .focus()
      .type("sers[0].e");

    agHelper.AssertElementText(CommonLocators._hints, "email");
  });
});
