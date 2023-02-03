import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage,
  CommonLocators,
  DataSources,
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
    agHelper.GetNAssertElementText(CommonLocators._hints, "isVisible");
    agHelper.Sleep();
    agHelper.GetNClickByContains(CommonLocators._hints, "isVisible");

    // 2. Document view widget autocomplete verification

    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
    agHelper.SelectNRemoveLineText(CommonLocators._codeMirrorTextArea);

    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "DocumentViewer1.");
    agHelper.GetNAssertElementText(CommonLocators._hints, "docUrl");
    agHelper.Sleep();
    agHelper.GetNClickByContains(CommonLocators._hints, "docUrl");
  });

  it("2. Check for bindings not available in other page", () => {
    // dependent on above case: 1st page should have DocumentViewer widget
    EntityExplorer.AddNewPage();

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
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "D");
    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "docUrl",
      "not.have.text",
    );
    agHelper.TypeText(
      CommonLocators._codeMirrorTextArea,
      "ocumentViewer.docUrl",
    );
  });

  it("3. Bug #15568 Verify browser JavaScript APIs in autocomplete ", () => {
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
    });
  });

  it("4. JSObject this. autocomplete", () => {
    // Using same js object
    // focus on 5th line
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "this.");

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      agHelper.AssertContains(element);
    });
  });

  it("5. Api data with array of object autocompletion test", () => {
    ApiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    agHelper.Sleep(2000);
    ApiPage.RunAPI();
    // Using same js object
    EntityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
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

  it("6. Local variables & complex data autocompletion test", () => {
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

  it("7. Autocompletion for bindings inside array and objects", () => {
    DataSources.CreateDataSource("Mongo", true, false);
    cy.get("@dsName").then(($dsName) => {
      DataSources.CreateNewQueryInDS(($dsName as unknown) as string);
      DataSources.ValidateNSelectDropdown(
        "Commands",
        "Find Document(s)",
        "Insert Document(s)",
      );

      cy.xpath(CommonLocators._inputFieldByName("Documents")).then(
        ($field: any) => {
          agHelper.UpdateCodeInput($field, `{\n"_id": "{{appsmith}}"\n}`);

          cy.wrap($field)
            .find(".CodeMirror")
            .find("textarea")
            .parents(".CodeMirror")
            .first()
            .then((ins: any) => {
              const input = ins[0].CodeMirror;
              input.focus();
              cy.wait(200);
              cy.get(CommonLocators._codeMirrorTextArea)
                .eq(1)
                .focus()
                .type(
                  "{downArrow}{downArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}",
                )
                .type(".");

              agHelper.GetNAssertElementText(
                CommonLocators._hints,
                "geolocation",
              );

              cy.get(".t--close-editor").click();
            });
        },
      );
    });
  });

  it("8. Multiple binding in single line", () => {
    DataSources.CreateDataSource("Postgres", true, false);
    cy.get("@dsName").then(($dsName) => {
      DataSources.CreateNewQueryInDS(
        ($dsName as unknown) as string,
        "SELECT * FROM worldCountryInfo where {{appsmith.store}} {{appsmith}}",
      );

      cy.get(CommonLocators._codeMirrorTextArea)
        .eq(0)
        .focus()
        .type("{downArrow}{leftArrow}{leftArrow}");

      agHelper.TypeText(CommonLocators._codeMirrorTextArea, ".");
      agHelper.GetNAssertElementText(CommonLocators._hints, "geolocation");
    });
  });

  it("9. Bug #17059 Autocomplete does not suggest same function name that belongs to a different object", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "JSObject1.");

    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "myFun1()",
      "have.text",
      4,
    );

    // Same check in JSObject1
    EntityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(CommonLocators._codeMirrorTextArea, "JSObject2.");

    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(
      CommonLocators._hints,
      "myFun1()",
      "have.text",
      4,
    );
  });
});
