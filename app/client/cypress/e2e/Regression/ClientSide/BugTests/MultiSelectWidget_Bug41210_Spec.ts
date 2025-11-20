import { locators } from "../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Bug 41210: MultiSelectWidgetV2 inside ListWidget - selected values and labels persist per item", function () {
  const widgetSelector = (name: string) => `[data-widgetname-cy="${name}"]`;
  const listContainer = `${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`;

  before(() => {
    _.agHelper.AddDsl("Listv2/emptyList");
    _.jsEditor.CreateJSObject(
      `export default {
  listItems: [
    { id: 1, name: "Row 1" },
    { id: 2, name: "Row 2" },
    { id: 3, name: "Row 3" }
  ],

  getItems() {
    return this.listItems;
  },

  deleteItemAtIndex(index) {
    this.listItems = this.listItems.filter((_, i) => i !== index);
    return this.listItems;
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
  });

  it("should persist selected values for each list item and initialize with default values on first render", function () {
    cy.dragAndDropToWidget("multiselectwidgetv2", "containerwidget", {
      x: 250,
      y: 50,
    });
    _.propPane.UpdatePropertyFieldValue("Default selected values", '["GREEN"]');
    EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
    _.propPane.UpdatePropertyFieldValue("Items", `{{JSObject1.getItems()}}`);
    _.agHelper.GetNClick(locators._enterPreviewMode);
    _.agHelper.SelectFromMultiSelect(["Red"]);

    cy.get(listContainer).eq(1).click();
    cy.get(listContainer).eq(0).click();
    cy.get(
      `${locators._widgetByName("MultiSelect1")} .rc-select-selection-item`,
    ).should("contain.text", "Red");
  });

  it("should delete first list item and keep selections mapped correctly", function () {
    _.agHelper.GetNClick(locators._exitPreviewMode);
    cy.dragAndDropToWidget("iconbuttonwidget", "containerwidget", {
      x: 350,
      y: 50,
    });

    _.propPane.EnterJSContext(
      "onClick",
      `{{JSObject1.deleteItemAtIndex(currentIndex)}}`,
      true,
      false,
    );

    _.agHelper.GetNClick(locators._enterPreviewMode);
    _.agHelper.SelectFromMultiSelect(["Red"], 1);
    _.agHelper.GetNClick(locators._widgetByName("IconButton1"));

    cy.get(listContainer).should("have.length", 2);

    cy.get(locators._widgetByName("MultiSelect1"))
      .eq(0)
      .find(".rc-select-selection-item")
      .should("contain.text", "Red");
  });
});
