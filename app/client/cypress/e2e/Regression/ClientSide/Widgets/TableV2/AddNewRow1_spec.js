import {
  agHelper,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Basic flow ",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Sanity"] },
  () => {
    before(() => {
      agHelper.RestoreLocalStorageCache();
      agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("1.1. should test that allow Add new row property is present", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".t--property-control-allowaddingarow").should("exist");
      cy.get(".t--property-control-allowaddingarow input").should("exist");
      cy.get(".t--add-new-row").should("not.exist");
      propPane.TogglePropertyState("Allow adding a row", "Off", null);
      cy.get(".t--add-new-row").should("not.exist");
      cy.get(".t--property-control-onsave").should("not.exist");
      cy.get(".t--property-control-ondiscard").should("not.exist");
      cy.get(".t--property-control-defaultvalues").should("not.exist");
      // onSave, onDiscard and default row are showing up only when the allow add new property is enabled
      propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--add-new-row").should("exist");
      cy.get(".t--property-control-onsave").should("exist");
      cy.get(".t--property-control-ondiscard").should("exist");
      cy.get(".t--property-control-defaultvalues").should("exist");
      cy.get(".t--add-new-row.disabled").should("not.exist");
      //  add new row link is disabled during the inline editing flow
      table.toggleColumnEditableViaColSettingsPane("step");
      cy.editTableCell(0, 0);
      cy.get(".t--add-new-row.disabled").should("exist");
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".tableWrap .new-row").should("not.exist");
      // clicking on add new row link adds an empty row at the top of the table
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("1.2. should test that new row is getting populated with the default row property value", () => {
      cy.updateCodeInput(
        ".t--property-control-defaultvalues",
        "{{{step: 'newStepCell'}}}",
      );
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal("newStepCell");
      });
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("1.3. should test that inline editing, row selection, pagination, search, filters are actions cannot be performed while in add new row feature", () => {
      cy.get(".t--widget-tablewidgetv2 .t--search-input").should("exist");
      cy.get(".t--widget-tablewidgetv2 .t--table-filter-toggle-btn").should(
        "exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-download-btn").should("exist");
      cy.get(".t--widget-tablewidgetv2 .t--add-new-row").should("exist");
      cy.get(".t--widget-tablewidgetv2 .show-page-items").should("exist");
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-prev-page").should(
        "exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-page-input").should(
        "exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-next-page").should(
        "exist",
      );

      cy.get(".t--add-new-row").click();

      cy.get(".t--widget-tablewidgetv2 .t--search-input").should("not.exist");
      cy.get(".t--widget-tablewidgetv2 .t--table-filter-toggle-btn").should(
        "not.exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-download-btn").should(
        "not.exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--add-new-row").should("not.exist");
      cy.get(".t--widget-tablewidgetv2 .show-page-items").should("not.exist");
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-prev-page").should(
        "not.exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-page-input").should(
        "not.exist",
      );
      cy.get(".t--widget-tablewidgetv2 .t--table-widget-next-page").should(
        "not.exist",
      );
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("1.4. should test that only editable column cells are in editmode in the new row", () => {
      cy.get(".t--add-new-row").click();
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
      table.toggleColumnEditableViaColSettingsPane("task");
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", false);
      table.toggleColumnEditableViaColSettingsPane("task", "v2", false);
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
    });

    it("1.5. should test that newRow property holds the entered data", () => {
      table.toggleColumnEditableViaColSettingsPane("step");
      table.toggleColumnEditableViaColSettingsPane("task");
      cy.enterTableCellValue(0, 0, "22");
      cy.enterTableCellValue(1, 0, "21");
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", `{{Table1.newRow}}`);
      cy.get(".t--widget-textwidget .bp3-ui-text").should(
        "contain",
        `{  "step": "22",  "task": "21"}`,
      );
    });

    it("1.6. should test that non data (iconBitton, button, menubutton) column cells are not showing up", () => {
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", false, false);
      ["Button", "Menu button", "Icon button"].forEach((columnType) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option").children().contains(columnType).click();
        cy.wait("@updateLayout");
        cy.get(`[data-colindex=0][data-rowindex=0] button`).should("not.exist");
      });
      cy.get("[data-testid='t--property-pane-back-btn']").click();
    });

    it("1.7. should not hide the header section when add new row button is enabled and another header element is disabled", () => {
      cy.get(".t--discard-new-row").click({ force: true });
      //disable all header widgets for the table
      [
        "Show pagination",
        "Allow searching",
        "Allow download",
        "Allow filtering",
        "Allow adding a row",
      ].forEach((val) => {
        propPane.TogglePropertyState(val, "Off");
      });
      cy.wait(1000);

      //intially enable 2 sections to show pagination and "add new row" button to the header section
      propPane.TogglePropertyState("Show pagination", "On");
      propPane.TogglePropertyState("Allow adding a row", "On");

      //"add new row" button should be present
      cy.get(".t--add-new-row").should("exist");
      //turn off pagination and now the "add new row" button should be the only component left in the header section
      propPane.TogglePropertyState("Show pagination", "Off");
      //"add new row" should continue to be present
      cy.get(".t--add-new-row").should("exist");
      //finally turn off allow adding a row then the "add new row" button should be removed from the header section
      propPane.TogglePropertyState("Allow adding a row", "Off");
      cy.get(".t--add-new-row").should("not.exist");
    });
  },
);
