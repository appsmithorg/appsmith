import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Autocomplete bug fixes", function () {
  it("1. Bug #12790 Verifies if selectedRow is in best match", function () {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 200, 200);
    _.table.AddSampleTableData();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 200, 600);
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", "{{Table1.");
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(_.locators._hints, "Best match");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "selectedRow",
      "have.text",
      1,
    );
  });

  it("2. Bug #13983 Verifies if object properties are in autocomplete list", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", '{{Table1.selectedRow["');
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "status",
      "contain.text",
    );

    _.propPane.TypeTextIntoField("Text", "{{Table1.selectedRow['");
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "status",
      "contain.text",
    );
  });

  it("3. Bug #13983 Verifies if object properties are in autocomplete list", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", '{{Table1.selectedRo"');
    _.agHelper.AssertElementAbsence(_.locators._hints);

    _.propPane.TypeTextIntoField("Text", '{{"');
    _.agHelper.AssertElementAbsence(_.locators._hints);
  });

  it("4. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function () {
    _.entityExplorer.CopyPasteWidget("Text1");
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.UpdatePropertyFieldValue("Text", "");
    _.propPane.TypeTextIntoField("Text", "{{Te");
    _.agHelper.AssertElementExist(_.locators._hints);
    _.agHelper.GetNAssertElementText(_.locators._hints, "Best match");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "Text1Copy.text",
      "have.text",
      1,
    );
  });

  it("5. Bug #14100 Custom columns name label change should reflect in autocomplete", function () {
    // select table widget
    _.entityExplorer.SelectEntityByName("Table1");
    // add new column
    cy.get(".t--add-column-btn").click();
    // edit column name
    cy.get(
      "[data-rbd-draggable-id='customColumn1'] .t--edit-column-btn",
    ).click();

    _.propPane.UpdatePropertyFieldValue("Property Name", "columnAlias");
    cy.wait(500);
    // select text widget
    _.entityExplorer.SelectEntityByName("Text1");

    // type {{Table1.selectedRow. and check for autocompletion suggestion having edited column name
    _.propPane.TypeTextIntoField("Text", "{{Table1.selectedRow.");
    _.agHelper.GetNAssertElementText(
      _.locators._hints,
      "columnAlias",
      "have.text",
      0,
    );
  });

  it("6. feat #16426 Autocomplete for fast-xml-parser", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", "{{xmlParser.j");
    _.agHelper.GetNAssertElementText(_.locators._hints, "j2xParser");

    _.propPane.TypeTextIntoField("Text", "{{new xmlParser.j2xParser().p");
    _.agHelper.GetNAssertElementText(_.locators._hints, "parse");
  });

  it(
    "excludeForAirgap",
    "7. Installed library should show up in autocomplete",
    function () {
      _.entityExplorer.ExpandCollapseEntity("Libraries");
      _.installer.openInstaller();
      _.installer.installLibrary("uuidjs", "UUID");
      _.installer.closeInstaller();
      _.entityExplorer.SelectEntityByName("Text1");
      _.propPane.TypeTextIntoField("Text", "{{UUI");
      _.agHelper.GetNAssertElementText(_.locators._hints, "UUID");
    },
  );

  it(
    "excludeForAirgap",
    "8. No autocomplete for Removed libraries",
    function () {
      _.entityExplorer.RenameEntityFromExplorer("Text1Copy", "UUIDTEXT");
      _.installer.uninstallLibrary("uuidjs");
      _.propPane.TypeTextIntoField("Text", "{{UUID.");
      _.agHelper.AssertElementAbsence(_.locators._hints);
    },
  );

  it("9. Bug #20449 Cursor should be between parenthesis when function is autocompleted (Property Pane)", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    _.propPane.TypeTextIntoField("Text", "{{console.l");

    _.agHelper.GetNClickByContains(_.locators._hints, "log");

    _.propPane.TypeTextIntoField("Text", '"hello"', false);

    // If the cursor was not between parenthesis, the following command will fail
    _.propPane.ValidatePropertyFieldValue("Text", '{{console.log("hello")}}');
  });

  it("10. Bug #20449 Cursor should be between parenthesis when function is autocompleted (JS Object)", function () {
    _.jsEditor.CreateJSObject(
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

    _.agHelper.GetNClick(_.jsEditor._lineinJsEditor(3));

    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "console.l");

    _.agHelper.GetNClickByContains(_.locators._hints, "log");

    _.agHelper.TypeText(_.locators._codeMirrorTextArea, "'hello'");

    // If the cursor was not between parenthesis, the following command will fail
    _.agHelper.GetNAssertContains(
      _.jsEditor._lineinJsEditor(3),
      "console.log('hello')",
    );
  });
});
