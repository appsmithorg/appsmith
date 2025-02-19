import {
  agHelper,
  apiPage,
  dataSources,
  draggableWidgets,
  entityExplorer,
  entityItems,
  dataManager,
  jsEditor,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

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

describe("Autocomplete tests", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
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
    agHelper.GetNClickByContains(locators._hints, "isVisible");

    // 2. Document view widget autocomplete verification

    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
    agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);

    agHelper.TypeText(locators._codeMirrorTextArea, "DocumentViewer1.");
    agHelper.GetNAssertElementText(locators._hints, "docUrl");
    agHelper.GetNClickByContains(locators._hints, "docUrl");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
  });

  it("2. Check for bindings not available in other page", () => {
    // dependent on above case: 1st page should have DocumentViewer widget
    PageList.AddNewPage();
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
      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
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
        expected: "eval",
        haveOrNotHave: false,
      },
      {
        type: "Blob",
        expected: "Blob",
        haveOrNotHave: true,
      },
      {
        type: "FormData",
        expected: "FormData",
        haveOrNotHave: true,
      },
      {
        type: "FileReader",
        expected: "FileReader",
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

    ["myFun2", "myVar1", "myVar2"].forEach((element, index) => {
      agHelper.AssertContains(element);
    });
  });

  it("5. Api data with array of object autocompletion test", () => {
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    // Using same js object
    EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
    agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);
    //agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "Api1.d");
    agHelper.GetNAssertElementText(locators._hints, "data");
    agHelper.TypeText(locators._codeMirrorTextArea, "ata[0].e");
    agHelper.GetNAssertElementText(locators._hints, "email");
    agHelper.TypeText(locators._codeMirrorTextArea, "mail");
    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "JSObject1",
      action: "Delete",
      entityType: entityItems.JSObject,
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
    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, codeToType);
    agHelper.GetNClick(jsEditor._lineinJsEditor(7));
    agHelper.TypeText(
      locators._codeMirrorTextArea,
      "const callBack = (user) => user",
    );
    agHelper.TypeText(locators._codeMirrorTextArea, ".l");
    agHelper.GetNAssertElementText(locators._hints, "label");
    agHelper.TypeText(locators._codeMirrorTextArea, "abel;");
    agHelper.TypeText(locators._codeMirrorTextArea, "data.");
    agHelper.GetNAssertElementText(locators._hints, "userCollection");
    agHelper.TypeText(locators._codeMirrorTextArea, "userCollection[0].");
    agHelper.GetNAssertElementText(locators._hints, "users");
    agHelper.TypeText(locators._codeMirrorTextArea, "users[0].");
    agHelper.GetNAssertElementText(locators._hints, "value");
    agHelper.GetNAssertElementText(locators._hints, "label", "have.text", 1);

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: jsName as string,
        action: "Delete",
        entityType: entityItems.JSObject,
      });
    });
    PageLeftPane.switchSegment(PagePaneSegment.Queries);
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
      "Command",
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
          .wait(200)
          .type(
            "{downArrow}{downArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}",
          )
          .type(".");

        agHelper.GetNAssertElementText(locators._hints, "appName");
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
    agHelper.GetNAssertElementText(locators._hints, "appName");
  });
});
