import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  propPane = ObjectsRegistry.PropertyPane;

describe("Autocomplete bug fixes", function() {
  it("1. Bug #12790 Verifies if selectedRow is in best match", function() {
    ee.DragDropWidgetNVerify("tablewidgetv2", 200, 200);
    ee.DragDropWidgetNVerify("textwidget", 200, 600);
    ee.SelectEntityByName("Text1");
    propPane.TypeTextIntoField("Text", "{{Table1.");
    agHelper.AssertElementExist(locator._hints);
    agHelper.AssertElementText(locator._hints, "Best Match");
    agHelper.AssertElementText(locator._hints, "selectedRow", 1);
  });

  it("2. Bug #14990 Checks if copied widget show up on autocomplete suggestions", function() {
    ee.CopyPasteWidget("Text1");
    ee.SelectEntityByName("Text1");
    propPane.UpdatePropertyFieldValue("Text", "");
    propPane.TypeTextIntoField("Text", "{{Te");
    agHelper.AssertElementExist(locator._hints);
    agHelper.AssertElementText(locator._hints, "Best Match");
    agHelper.AssertElementText(
      locator._hints,
      "Text1Copy.text",
      1,
    );
  });
});
