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
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      agHelper.AddDsl("Table/ScrollbarDSL");
    });

    it("1. Table body should not have the scrollbar", function () {
      let tableHeight = 0;

      cy.get(".t--draggable-tablewidgetv2 .table").then(($table) => {
        tableHeight = $table[0].clientHeight;
      });

      cy.get(".t--draggable-tablewidgetv2 .table .simplebar-content").then(
        ($scrollBox) =>
          /* 2 is the scrollbar offset which is needed for virtual table */
          expect($scrollBox[0].clientHeight + 2).to.be.equal(tableHeight),
      );
    });
  },
);
