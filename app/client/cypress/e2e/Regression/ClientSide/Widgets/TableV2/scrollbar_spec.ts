import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget v2: tableData change test",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("Table/ScrollbarDSL");
    });

    it("1. Table body should not have the scrollbar", function () {
      let tableHeight = 0;
      const TABLE_SCROLLBAR_HEIGHT = 10; // From Constants.ts

      cy.get(".t--draggable-tablewidgetv2 .table").then(($table) => {
        tableHeight = $table[0].clientHeight;
      });

      cy.get(".t--draggable-tablewidgetv2 .table .simplebar-content").then(
        ($scrollBox) => {
          // The scroll container height calculation always accounts for the horizontal scrollbar
          // by subtracting TABLE_SCROLLBAR_HEIGHT, even when the scrollbar is not visible.
          // Therefore, we need to account for this in our comparison.
          const expectedScrollBoxHeight = tableHeight - TABLE_SCROLLBAR_HEIGHT;
          expect($scrollBox[0].clientHeight).to.be.equal(
            expectedScrollBoxHeight,
          );
        },
      );
    });
  },
);
