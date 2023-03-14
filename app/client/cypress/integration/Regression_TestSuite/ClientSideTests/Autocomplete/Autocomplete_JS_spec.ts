import { WIDGET } from "../../../../locators/WidgetLocators";
import * as _ from "../../../../support/Objects/ObjectsCore";

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
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.BUTTON_GROUP, 200, 200);
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.DOCUMENT_VIEWER, 200, 500);

    // create js object
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // focus on 5th line
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));

    // 1. Button group widget autocomplete verification
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "ButtonGroup1.");
    _.agHelper.GetNAssertElementText(_.locators._hints, "isVisible");
    _.agHelper.Sleep();
    _.agHelper.GetNClickByContains(_.locators._hints, "isVisible");

    // 2. Document view widget autocomplete verification

    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5), 0, true);
    _.agHelper.SelectNRemoveLineText(_.locators._codeMirrorTextArea);

    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "DocumentViewer1.");
    _.agHelper.GetNAssertElementText(_.locators._hints, "docUrl");
    _.agHelper.Sleep();
    _.agHelper.GetNClickByContains(_.locators._hints, "docUrl");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });

  it("2. Check for bindings not available in other page", () => {
    // dependent on above case: 1st page should have DocumentViewer widget
    _.entityExplorer.AddNewPage();

    // create js object
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // focus on 5th line
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "D");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "docUrl",
      "not.have.text",
    );
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "ocumentViewer.docUrl");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });

  it("3. Bug #15568 Verify browser JavaScript APIs in autocomplete ", () => {
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // focus on 5th line
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));

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
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, test.type);
      _.agHelper.GetNAssertElementText(
        _.locators._hints,
        test.expected,
        test.haveOrNotHave ? "have.text" : "not.have.text",
      );
      _.agHelper.SelectNRemoveLineText(_.locators._codeMirrorTextArea);
    });
  });

  it("4. JSObject this. autocomplete", () => {
    // Using same js object
    // focus on 5th line
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "this.");

    ["myFun2()", "myVar1", "myVar2"].forEach((element, index) => {
      _.agHelper.AssertContains(element);
    });
  });

  it("5. Api data with array of object autocompletion test", () => {
    cy.fixture("datasources").then((datasourceFormData: any) => {
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"]);
      _.agHelper.Sleep(2000);
      _.apiPage.RunAPI();
      // Using same js object
      _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
      _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5), 0, true);
      _.agHelper.SelectNRemoveLineText(_.locators._codeMirrorTextArea);
      //_.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, "Api1.d");
      _.agHelper.GetNAssertElementText(_.locators._hints, "data");
      _.agHelper.Sleep();
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, "ata[0].e");
      _.agHelper.GetNAssertElementText(_.locators._hints, "email");
      _.agHelper.Sleep();
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, "mail");
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        "JSObject1",
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });

  it("6. Local variables & complex data autocompletion test", () => {
    _.jsEditor.CreateJSObject(jsObjectBody, {
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
    //_.agHelper.Sleep();
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, codeToType);
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(7));
    _.agHelper.TypeText(
      _.locators._codeMirrorTextArea,
      "const callBack = (user) => user.l",
    );
    _.agHelper.GetNAssertElementText(_.locators._hints, "label");
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "abel;");
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "data.");
    _.agHelper.GetNAssertElementText(_.locators._hints, "userCollection");
    _.agHelper.Sleep();
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "userCollection[0].");
    _.agHelper.GetNAssertElementText(_.locators._hints, "users");
    _.agHelper.Sleep();
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "users[0].");
    _.agHelper.GetNAssertElementText(_.locators._hints, "label");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "value",
      "have.text",
      1,
    );

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
    _.entityExplorer.ActionContextMenuByEntityName(
      "Api1",
      "Delete",
      "Are you sure?",
    );
  });

  it("7. Autocompletion for bindings inside array and objects", () => {
    _.dataSources.CreateDataSource("Mongo", true, false);
    _.dataSources.CreateQueryAfterDSSaved();

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Find Document(s)",
      "Insert Document(s)",
    );

    cy.xpath(_.locators._inputFieldByName("Documents")).then(($field: any) => {
      _.agHelper.UpdateCodeInput($field, `{\n"_id": "{{appsmith}}"\n}`);

      cy.wrap($field)
        .find(".CodeMirror")
        .find("textarea")
        .parents(".CodeMirror")
        .first()
        .then((ins: any) => {
          const input = ins[0].CodeMirror;
          input.focus();
          cy.wait(200);
          cy.get(_.locators._codeMirrorTextArea)
            .eq(1)
            .focus()
            .type(
              "{downArrow}{downArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}",
            )
            .type(".");

          _.agHelper.GetNAssertElementText(_.locators._hints, "geolocation");

          cy.get(".t--close-editor").click();
        });
    });
  });

  it("8. Multiple binding in single line", () => {
    _.dataSources.CreateDataSource("Postgres", true, false);

    _.dataSources.CreateQueryAfterDSSaved(
      "SELECT * FROM worldCountryInfo where {{appsmith.store}} {{appsmith}}",
    );
    cy.get(_.locators._codeMirrorTextArea)
      .eq(0)
      .focus()
      .type("{downArrow}{leftArrow}{leftArrow}");

    _.agHelper.TypeText(_.locators._codeMirrorTextArea, ".");
    _.agHelper.GetNAssertElementText(_.locators._hints, "geolocation");
  });

  it("9. Bug #17059 Autocomplete does not suggest same function name that belongs to a different object", () => {
    // create js object - JSObject1
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    // create js object - JSObject2
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "JSObject1.");

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "myFun1()",
      "have.text",
      4,
    );

    // Same check in JSObject1
    _.entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    _.agHelper.Sleep();
    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "JSObject2");
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, ".");

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "myFun1.data",
      "have.text",
      0,
    );

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "myFun1()",
      "have.text",
      4,
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject1",
      "Delete",
      "Are you sure?",
      true,
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "JSObject2",
      "Delete",
      "Are you sure?",
      true,
    );
  });

  it("10. Bug #10115 Autocomplete needs to show async await keywords instead of showing 'no suggestions'", () => {
    // create js object
    _.jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(5));
    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "aw");

    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "await",
      "have.text",
      0,
    );

    _.agHelper.RemoveCharsNType(_.locators._codeMirrorTextArea, 2, "as");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "async",
      "have.text",
      0,
    );
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.entityExplorer.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });
});
