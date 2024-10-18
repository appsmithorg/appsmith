import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  installer,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Autocomplete bug fixes",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    it("1. Bug #12790 Verifies if selectedRow is in best match", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 200, 200);
      table.AddSampleTableData();
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", '{{Table1.selectedRow["');
      agHelper.AssertElementExist(locators._hints);
      agHelper.GetNAssertElementText(locators._hints, "status", "contain.text");

      propPane.TypeTextIntoField("Text", "{{Table1.selectedRow['");
      agHelper.AssertElementExist(locators._hints);
      agHelper.GetNAssertElementText(locators._hints, "status", "contain.text");
    });

    it("3. Bug #13983 Verifies if object properties are in autocomplete list", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.TypeTextIntoField("Text", '{{Table1.selectedRo"');
      agHelper.AssertElementAbsence(locators._hints);

      propPane.TypeTextIntoField("Text", '{{"');
      agHelper.AssertElementAbsence(locators._hints);
    });

    it("4. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function () {
      entityExplorer.CopyPasteWidget("Text1");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
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
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      // add new column
      cy.get(".t--add-column-btn").click();
      // edit column name
      cy.get(
        "[data-rbd-draggable-id='customColumn1'] .t--edit-column-btn",
      ).click();

      propPane.UpdatePropertyFieldValue("Property Name", "columnAlias");
      // select text widget
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      // type {{Table1.selectedRow. and check for autocompletion suggestion having edited column name
      propPane.TypeTextIntoField("Text", "{{Table1.selectedRow.");
      agHelper.GetNAssertElementText(
        locators._hints,
        "columnAlias",
        "have.text",
        0,
      );
    });

    it(
      "7. Installed library should show up in autocomplete",
      { tags: ["@tag.excludeForAirgap"] },
      function () {
        AppSidebar.navigate(AppSidebarButton.Libraries);
        installer.OpenInstaller();
        installer.InstallLibrary("uuidjs", "UUID");
        installer.CloseInstaller();
        AppSidebar.navigate(AppSidebarButton.Editor);
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
        propPane.TypeTextIntoField("Text", "{{UUI");
        agHelper.GetNAssertElementText(locators._hints, "UUID");
      },
    );

    it(
      "8. No autocomplete for Removed libraries",
      { tags: ["@tag.excludeForAirgap"] },
      function () {
        entityExplorer.RenameEntityFromExplorer("Text1Copy", "UUIDTEXT");
        AppSidebar.navigate(AppSidebarButton.Libraries);
        installer.uninstallLibrary("uuidjs");
        AppSidebar.navigate(AppSidebarButton.Editor);
        propPane.TypeTextIntoField("Text", "{{UUID.");
        agHelper.AssertElementAbsence(locators._hints);
      },
    );

    it("9. Bug #20449 Cursor should be between parenthesis when function is autocompleted (Property Pane)", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
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

    it("11. Bug #31114 Verify Object Properties in Autocomplete List for isVisible Field in JSONForm Widget", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 400, 800);
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.EnterJSContext("Visible", "");
      propPane.TypeTextIntoField("Visible", "{{JSONForm1.isVis");
      agHelper.AssertElementExist(locators._hints);
      agHelper.GetNAssertElementText(
        locators._hints,
        "isVisible",
        "contain.text",
      );
    });
  },
);
