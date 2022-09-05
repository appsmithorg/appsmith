import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

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
  it("1. Bug #13613 Verify widgets autocomplete: ButtonGroup & Document viewer widget", () => {
    EntityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON_GROUP, 200, 200);
    EntityExplorer.DragDropWidgetNVerify(WIDGET.DOCUMENT_VIEWER, 200, 500);

    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // focus on 5th line
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));

    // 1. Button group widget autocomplete verification
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "ButtonGroup1.");
    agHelper.GetNAssertElementText(CommonLocators._hints, "groupButtons");
    agHelper.Sleep();
    agHelper.GetNClickByContains(CommonLocators._hints, "groupButtons");
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, ".");
    agHelper.GetNAssertElementText(CommonLocators._hints, "groupButton1");
    agHelper.Sleep();
    agHelper.GetNClickByContains(CommonLocators._hints, "groupButton1");

    // 2. Document view widget autocomplete verification

    agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "DocumentViewer1.");
    agHelper.GetNAssertElementText(CommonLocators._hints, "docUrl");
    agHelper.Sleep();
    agHelper.GetNClickByContains(CommonLocators._hints, "docUrl");
  });

  it("2. Bug #15568 Verify browser JavaScript APIs in autocomplete ", () => {
    // Using same js object
    agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);
    // focus on 5th line
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));

    const JSAPIsToTest = [
      // console API verification
      {
        type: "console",
        expected: "console",
        haveOrNotHave: true,
      },
      // crypto API verification
      {
        type: "crypto",
        expected: "crypto",
        haveOrNotHave: true,
      },
      // eval function verification
      {
        type: "eval",
        expected: "eval()",
        haveOrNotHave: false,
      },
      {
        type: "Blob",
        expected: "Blob()",
        haveOrNotHave: true,
      },
      {
        type: "FormData",
        expected: "FormData()",
        haveOrNotHave: true,
      },
      {
        type: "FileReader",
        expected: "FileReader()",
        haveOrNotHave: true,
      },
    ];

    JSAPIsToTest.forEach((test, index) => {
      agHelper.TypeText(CommonLocators._codeMirrorTextArea, test.type);
      agHelper.GetNAssertElementText(
        CommonLocators._hints,
        test.expected,
        test.haveOrNotHave ? "have.text" : "not.have.text",
      );
      agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);

      //const deleteCharCount = (JSAPIsToTest[index - 1]?.type || " ").length;
      // cy.get(CommonLocators._codeMirrorTextArea)
      //   .focus()
      //   // remove previously typed code
      //   .type(deleteCharCount ? "{backspace}".repeat(deleteCharCount) : " ")
      //   .wait(20)
      //   .type(test.type);
    });
    //EntityExplorer.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?", true);
  });

  it("3. JSObject this. autocomplete", () => {
    // Using same js object
    //agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);
    // focus on 5th line
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "this.");

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      agHelper.AssertContains(element);
      //cy.get(`.CodeMirror-hints > :nth-child(${index + 1})`).contains(element);
    });
  });

  it("4. Api data with array of object autocompletion test", () => {
    ApiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    agHelper.Sleep(2000);
    ApiPage.RunAPI();
    // Using same js object
    EntityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);
    //agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "Api1.data.u");
    agHelper.GetNAssertElementText(CommonLocators._hints, "users");
    agHelper.Sleep();
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "sers[0].e");
    agHelper.GetNAssertElementText(CommonLocators._hints, "email");
    agHelper.Sleep();
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "mail");
  });

  it("5. Local variables & complex data autocompletion test", () => {
    // Using same js object
    agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);
    const users = [
      { label: "a", value: "b" },
      { label: "a", value: "b" },
    ];

    const codeToType = `const users = ${JSON.stringify(users)};
    const data = { userCollection: [{ users }, { users }] };

    users.map(callBack);`;

    // component re-render cause DOM element of cy.get to lost
    // added wait to finish re-render before cy.get
    agHelper.Sleep();
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, codeToType);
    agHelper.GetNClick(jsEditor._lineinJsEditor(7));
    agHelper.TypeText(
      CommonLocators._codeMirrorTextArea,
      "const callBack = (user) => user.l",
    );
    agHelper.GetNAssertElementText(CommonLocators._hints, "label");
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "abel;");
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "data.");
    agHelper.GetNAssertElementText(CommonLocators._hints, "userCollection");
    agHelper.Sleep();
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "userCollection[0].");
    agHelper.GetNAssertElementText(CommonLocators._hints, "users");
    agHelper.Sleep();
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "users[0].");
    agHelper.GetNAssertElementText(CommonLocators._hints, "label");
    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "value",
      "have.text",
      1,
    );
    EntityExplorer.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
      true,
    );
    EntityExplorer.ActionContextMenuByEntityName(
      "Api1",
      "Delete",
      "Are you sure?",
    );
  });
});
