import {
  agHelper,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Table Widget v2 property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2AndTextDsl");
    });

    it("1. Table widget v2 new menu button column should not deselect row", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      cy.get(".t--widget-textwidget").should("have.text", "0");
      agHelper.ClickButton("Open Menu");
      cy.get(".t--widget-textwidget").should("have.text", "0");
    });
  },
);
