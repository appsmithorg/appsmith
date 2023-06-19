import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
  propPane,
  table,
  installer,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Autocomplete bug fixes", function () {
  it("1. Bug #12790 Verifies if selectedRow is in best match", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
    table.AddSampleTableData();
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{Table1.");
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "Best match");
    agHelper.GetNAssertElementText(
      locators._hints,
      "selectedRow",
      "have.text",
      1,
    );
  });

  it("2. Bug #13983 Verifies if object properties are in autocomplete list", function () {
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", '{{Table1.selectedRow["');
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "status", "contain.text");

    propPane.TypeTextIntoField("Text", "{{Table1.selectedRow['");
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "status", "contain.text");
  });

  it("3. Bug #13983 Verifies if object properties are in autocomplete list", function () {
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", '{{Table1.selectedRo"');
    agHelper.AssertElementAbsence(locators._hints);

    propPane.TypeTextIntoField("Text", '{{"');
    agHelper.AssertElementAbsence(locators._hints);
  });

  it("4. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function () {
    entityExplorer.CopyPasteWidget("Text1");
    entityExplorer.SelectEntityByName("Text1");
    propPane.UpdatePropertyFieldValue("Text", "");
    propPane.TypeTextIntoField("Text", "{{Te");
    agHelper.AssertElementExist(locators._hints);
    agHelper.GetNAssertElementText(locators._hints, "Best match");
    agHelper.GetNAssertElementText(
      locators._hints,
      "Text1Copy.text",
      "have.text",
      1,
    );
  });

  it("5. Bug #14100 Custom columns name label change should reflect in autocomplete", function () {
    // select table widget
    entityExplorer.SelectEntityByName("Table1");
    // add new column
    cy.get(".t--add-column-btn").click();
    // edit column name
    cy.get(
      "[data-rbd-draggable-id='customColumn1'] .t--edit-column-btn",
    ).click();

    propPane.UpdatePropertyFieldValue("Property Name", "columnAlias");
    cy.wait(500);
    // select text widget
    entityExplorer.SelectEntityByName("Text1");

    // type {{Table1.selectedRow. and check for autocompletion suggestion having edited column name
    propPane.TypeTextIntoField("Text", "{{Table1.selectedRow.");
    agHelper.GetNAssertElementText(
      locators._hints,
      "columnAlias",
      "have.text",
      0,
    );
  });

  it("6. feat #16426 Autocomplete for fast-xml-parser", function () {
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{xmlParser.j");
    agHelper.GetNAssertElementText(locators._hints, "j2xParser");

    propPane.TypeTextIntoField("Text", "{{new xmlParser.j2xParser().p");
    agHelper.GetNAssertElementText(locators._hints, "parse");
  });

  it(
    "excludeForAirgap",
    "7. Installed library should show up in autocomplete",
    function () {
      entityExplorer.ExpandCollapseEntity("Libraries");
      installer.OpenInstaller();
      installer.installLibrary("uuidjs", "UUID");
      installer.CloseInstaller();
      entityExplorer.SelectEntityByName("Text1");
      propPane.TypeTextIntoField("Text", "{{UUI");
      agHelper.GetNAssertElementText(locators._hints, "UUID");
    },
  );

  it(
    "excludeForAirgap",
    "8. No autocomplete for Removed libraries",
    function () {
      entityExplorer.RenameEntityFromExplorer("Text1Copy", "UUIDTEXT");
      installer.uninstallLibrary("uuidjs");
      propPane.TypeTextIntoField("Text", "{{UUID.");
      agHelper.AssertElementAbsence(locators._hints);
    },
  );

  it("9. Bug #20449 Cursor should be between parenthesis when function is autocompleted (Property Pane)", function () {
    entityExplorer.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{console.l");

    agHelper.GetNClickByContains(locators._hints, "log");

    propPane.TypeTextIntoField("Text", '"hello"', false);

    // If the cursor was not between parenthesis, the following command will fail
    propPane.ValidatePropertyFieldValue("Text", '{{console.log("hello")}}');
  });

  it("10. Bug #20449 Cursor should be between parenthesis when function is autocompleted (JS Object)", function () {
    jsEditor.CreateJSObject(
      `export default {
    myFun1: () => {

    },
  }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );

    agHelper.GetNClick(jsEditor._lineinJsEditor(3));

    agHelper.TypeText(locators._codeMirrorTextArea, "console.l");

    agHelper.GetNClickByContains(locators._hints, "log");

    agHelper.TypeText(locators._codeMirrorTextArea, "'hello'");

    // If the cursor was not between parenthesis, the following command will fail
    agHelper.GetNAssertContains(
      jsEditor._lineinJsEditor(3),
      "console.log('hello')",
    );
  });
});
