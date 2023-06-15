import {
  agHelper,
  apiPage,
  dataSources,
  draggableWidgets,
  entityExplorer,
  entityItems,
  jsEditor,
  locators,
} from "../../../../support/Objects/ObjectsCore";

let jsName: any;

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
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.BUTTON_GROUP,
      200,
      200,
    );
    entityExplorer.DragDropWidgetNVerify(
      draggableWidgets.DOCUMENT_VIEWER,
      200,
      500,
    );

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
    agHelper.TypeText(locators._codeMirrorTextArea, "ButtonGroup1.");
    agHelper.GetNAssertElementText(locators._hints, "isVisible");
    agHelper.Sleep();
    agHelper.GetNClickByContains(locators._hints, "isVisible");

    // 2. Document view widget autocomplete verification

    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
    agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);

    agHelper.TypeText(locators._codeMirrorTextArea, "DocumentViewer1.");
    agHelper.GetNAssertElementText(locators._hints, "docUrl");
    agHelper.Sleep();
    agHelper.GetNClickByContains(locators._hints, "docUrl");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("2. Check for bindings not available in other page", () => {
    // dependent on above case: 1st page should have DocumentViewer widget
    entityExplorer.AddNewPage();
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
    agHelper.TypeText(locators._codeMirrorTextArea, "D");
    agHelper.GetNAssertElementText(locators._hints, "docUrl", "not.have.text");
    agHelper.TypeText(locators._codeMirrorTextArea, "ocumentViewer.docUrl");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("3. Bug #15568 Verify browser JavaScript APIs in autocomplete ", () => {
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

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
      agHelper.TypeText(locators._codeMirrorTextArea, test.type);
      agHelper.GetNAssertElementText(
        locators._hints,
        test.expected,
        test.haveOrNotHave ? "have.text" : "not.have.text",
      );
      agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);
    });
  });

  it("4. JSObject this. autocomplete", () => {
    // Using same js object
    // focus on 5th line
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "this.");

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      agHelper.AssertContains(element);
    });
  });

  it("5. Api data with array of object autocompletion test", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      agHelper.Sleep(2000);
      apiPage.RunAPI();
      // Using same js object
      entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
      agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
      agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);
      //agHelper.GetNClick(jsEditor._lineinJsEditor(5));
      agHelper.TypeText(locators._codeMirrorTextArea, "Api1.d");
      agHelper.GetNAssertElementText(locators._hints, "data");
      agHelper.Sleep();
      agHelper.TypeText(locators._codeMirrorTextArea, "ata[0].e");
      agHelper.GetNAssertElementText(locators._hints, "email");
      agHelper.Sleep();
      agHelper.TypeText(locators._codeMirrorTextArea, "mail");
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "JSObject1",
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("6. Local variables & complex data autocompletion test", () => {
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    const users = [
      { label: "a", value: "b" },
      { label: "a", value: "b" },
    ];

    let codeToType = `const users = ${JSON.stringify(users)};
    const data = { userCollection: [{ users }, { users }] };

    users.map(callBack);`;

    // component re-render cause DOM element of cy.get to lost
    // added wait to finish re-render before cy.get
    //agHelper.Sleep();
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, codeToType);
    agHelper.GetNClick(jsEditor._lineinJsEditor(7));
    agHelper.TypeText(
      locators._codeMirrorTextArea,
      "const callBack = (user) => user.l",
    );
    agHelper.GetNAssertElementText(locators._hints, "label");
    agHelper.TypeText(locators._codeMirrorTextArea, "abel;");
    agHelper.TypeText(locators._codeMirrorTextArea, "data.");
    agHelper.GetNAssertElementText(locators._hints, "userCollection");
    agHelper.Sleep();
    agHelper.TypeText(locators._codeMirrorTextArea, "userCollection[0].");
    agHelper.GetNAssertElementText(locators._hints, "users");
    agHelper.Sleep();
    agHelper.TypeText(locators._codeMirrorTextArea, "users[0].");
    agHelper.GetNAssertElementText(locators._hints, "label");
    agHelper.GetNAssertElementText(locators._hints, "value", "have.text", 1);

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Api1",
      action: "Delete",
      entityType: entityItems.Api,
    });
  });

  it("7. Autocompletion for bindings inside array and objects", () => {
    dataSources.CreateDataSource("Mongo", true, false);
    dataSources.CreateQueryAfterDSSaved();

    dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find document(s)",
      "Insert document(s)",
    );

    const documentInputSelector = locators._inputFieldByName("Documents");

    agHelper.UpdateCodeInput(
      documentInputSelector,
      `{\n"_id": "{{appsmith}}"\n}`,
    );

    cy.xpath(documentInputSelector)
      .find(".CodeMirror")
      .find("textarea")
      .parents(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        cy.wait(200);
        cy.get(locators._codeMirrorTextArea)
          .eq(0)
          .focus()
          .type(
            "{downArrow}{downArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}",
          )
          .type(".");

        agHelper.GetNAssertElementText(locators._hints, "geolocation");

        cy.get(".t--close-editor").click();
      });
  });

  it("8. Multiple binding in single line", () => {
    dataSources.CreateDataSource("Postgres", true, false);
    dataSources.CreateQueryAfterDSSaved(
      "SELECT * FROM worldCountryInfo where {{appsmith.store}} {{appsmith}}",
    );
    cy.get(locators._codeMirrorTextArea)
      .eq(0)
      .focus()
      .type("{downArrow}{leftArrow}{leftArrow}");

    agHelper.TypeText(locators._codeMirrorTextArea, ".");
    agHelper.GetNAssertElementText(locators._hints, "geolocation");
  });

  it("9. Bug #17059 Autocomplete does not suggest same function name that belongs to a different object", () => {
    // create js object - JSObject1
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // create js object - JSObject2
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "JSObject1.");

    agHelper.GetNAssertElementText(
      locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(locators._hints, "myFun1()", "have.text", 4);

    // Same check in JSObject1
    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "JSObject2");
    agHelper.Sleep();
    agHelper.TypeText(locators._codeMirrorTextArea, ".");

    agHelper.GetNAssertElementText(
      locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    agHelper.GetNAssertElementText(locators._hints, "myFun1()", "have.text", 4);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject2",
      action: "Delete",
      entityType: entityItems.JSObject,
    });
  });

  it("10. Bug #10115 Autocomplete needs to show async await keywords instead of showing 'no suggestions'", () => {
    // create js object
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "aw");

    agHelper.GetNAssertElementText(locators._hints, "await", "have.text", 0);

    agHelper.RemoveCharsNType(locators._codeMirrorTextArea, 2, "as");
    agHelper.GetNAssertElementText(locators._hints, "async", "have.text", 0);
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("10. Bug #15429 Random keystrokes trigger autocomplete to show up", () => {
    // create js object
    jsEditor.CreateJSObject(
      `export default
      myFunc1() {
        showAlert("Hello world");

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

    //Paste the code and assert that the hints are not present
    jsEditor.CreateJSObject(`const x = "Hello world;"`, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: false,
      prettify: false,
    });

    agHelper.AssertElementAbsence(locators._hints);

    //Paste the code and assert that the hints are not present
    jsEditor.CreateJSObject(
      `export default
      myFunc1() {
        showAlert("Hello world");

      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
        prettify: false,
      },
    );

    agHelper.AssertElementAbsence(locators._hints);

    agHelper.GetElement(jsEditor._lineinJsEditor(4)).click();

    //Assert that hints are not present inside the string
    agHelper.TypeText(locators._codeMirrorTextArea, `const x = "`);

    agHelper.AssertElementAbsence(locators._hints);

    agHelper.SelectNRemoveLineText(jsEditor._lineinJsEditor(4));

    //Assert that hints are not present when line is cleared with backspace
    agHelper.AssertElementAbsence(locators._hints);

    //Assert that hints are not present when token is a comment
    agHelper.TypeText(locators._codeMirrorTextArea, "// showA'");

    agHelper.AssertElementAbsence(locators._hints);

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });
});
