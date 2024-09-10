import { agHelper, table } from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget inline editing functionality",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("1. When editing a row, the selected row should change the UI accordingly ", () => {
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.editColumn("EditActions1");
      cy.editTableCell(0, 1);
      cy.enterTableCellValue(0, 1, "NewValue");
    });
  },
);
