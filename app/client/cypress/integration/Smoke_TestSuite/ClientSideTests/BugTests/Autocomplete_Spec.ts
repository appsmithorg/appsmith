import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const {
  AggregateHelper,
  CommonLocators,
  EntityExplorer,
  PropertyPane,
} = ObjectsRegistry;

describe("Autocomplete bug fixes", function() {
  it("1. Bug #12790 Verifies if selectedRow is in best match", function() {
    EntityExplorer.DragDropWidgetNVerify(WIDGET.TABLE, 200, 200);
    EntityExplorer.DragDropWidgetNVerify(WIDGET.TEXT, 200, 600);
    EntityExplorer.SelectEntityByName("Text1");
    PropertyPane.UpdatePropertyFieldValue("Text", "{{Table1.}}");
    AggregateHelper.AssertElementExist(CommonLocators._hints);
    AggregateHelper.AssertElementText(CommonLocators._hints, "Best Match");
    AggregateHelper.AssertElementText(CommonLocators._hints, "selectedRow", 1);
  });

  it("2. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function() {
    EntityExplorer.CopyPasteWidget("Text1");
    EntityExplorer.SelectEntityByName("Text1");
    PropertyPane.UpdatePropertyFieldValue("Text", "");
    PropertyPane.TypeTextIntoField("Text", "{{Te");
    AggregateHelper.AssertElementExist(CommonLocators._hints);
    AggregateHelper.AssertElementText(CommonLocators._hints, "Best Match");
    AggregateHelper.AssertElementText(
      CommonLocators._hints,
      "Text1Copy.text",
      1,
    );
  });

  it("3. Bug #14100 Custom columns name label change should reflect in autocomplete", function() {
    // select table widget
    EntityExplorer.SelectEntityByName("Table1");
    // add new column
    cy.get(".t--add-column-btn").click();
    // edit column name
    cy.get(
      "[data-rbd-draggable-id='customColumn1'] .t--edit-column-btn",
    ).click();

    PropertyPane.UpdatePropertyFieldValue("Property name", "columnAlias");
    cy.wait(500);
    // select text widget
    EntityExplorer.SelectEntityByName("Text1");

    // type {{Table1.selectedRow. and check for autocompletion suggestion having edited column name
    PropertyPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRow.}}");
    cy.get("body").type(`{end}{leftArrow}{leftArrow}`);
    cy.get("body").type(`{ctrl} `);

    cy.get(`${CommonLocators._hints} li`)
      .eq(1)
      .should("have.text", "columnAlias");
  });
});
