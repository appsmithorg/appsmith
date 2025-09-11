import { locators } from "../../../../support/Objects/ObjectsCore";
import * as _ from "../../../../support/Objects/ObjectsCore";

const widgetSelector = (name: string) => `[data-widgetname-cy="${name}"]`;

describe("Bug 41210: MultiSelectWidgetV2 inside ListWidget - selected values and labels persist per item", function () {
  before(() => {
    _.agHelper.AddDsl("Listv2/emptyList");
  });

  it("should persist selected values for each list item and initialize with default values on first render", function () {
    cy.dragAndDropToWidget("multiselectwidgetv2", "containerwidget", {
      x: 250,
      y: 50,
    });
    _.propPane.UpdatePropertyFieldValue("Default selected values", '["GREEN"]');
    _.agHelper.GetNClick(locators._enterPreviewMode);
    _.agHelper.SelectFromMultiSelect(["Red"]);

    const listContainer = `${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`;

    cy.get(listContainer).eq(1).click();
    cy.get(listContainer).eq(0).click();
    cy.get(
      `${widgetSelector("MultiSelect1")} .rc-select-selection-item`,
    ).should("contain.text", "Red");
  });
});
