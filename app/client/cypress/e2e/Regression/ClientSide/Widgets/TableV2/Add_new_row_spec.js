import * as _ from "../../../../../support/Objects/ObjectsCore";
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Table widget Add new row feature's", () => {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  describe("Basic flow ", () => {
    before(() => {
      _.agHelper.RestoreLocalStorageCache();
      cy.fixture("Table/InlineEditingDSL").then((val) => {
        _.agHelper.AddDsl(val);
      });
    });

    it("1.1. should test that allow Add new row property is present", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".t--property-control-allowaddingarow").should("exist");
      cy.get(".t--property-control-allowaddingarow input").should("exist");
    });

    it("1.2. should test that Add new row link appears on the UI when the allow add new row property is enabled", () => {
      cy.get(".t--add-new-row").should("not.exist");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--add-new-row").should("exist");
      _.propPane.TogglePropertyState("Allow adding a row", "Off");
      cy.get(".t--add-new-row").should("not.exist");
    });

    it("1.3. should test that onSave, onDiscard and default row are showing up only when the allow add new property is enabled", () => {
      cy.get(".t--property-control-onsave").should("not.exist");
      cy.get(".t--property-control-ondiscard").should("not.exist");
      cy.get(".t--property-control-defaultvalues").should("not.exist");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--property-control-onsave").should("exist");
      cy.get(".t--property-control-ondiscard").should("exist");
      cy.get(".t--property-control-defaultvalues").should("exist");
    });

    it("1.4. should test that add new row link is disabled during the inline editing flow", () => {
      cy.get(".t--add-new-row.disabled").should("not.exist");
      cy.makeColumnEditable("step");
      cy.editTableCell(0, 0);
      cy.get(".t--add-new-row.disabled").should("exist");
    });

    it("1.5. should test that clicking on add new row link adds an empty row at the top of the table", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".tableWrap .new-row").should("not.exist");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("1.6. should test that new row is getting populated with the default row property value", () => {
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

    it("1.7. should test that inline editing, row selection, pagination, search, filters are actions cannot be performed while in add new row feature", () => {
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

    it("1.8. should test that only editable column cells are in editmode in the new row", () => {
      cy.get(".t--add-new-row").click();
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
      cy.makeColumnEditable("task");
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("exist");
      cy.makeColumnEditable("step");
      cy.makeColumnEditable("task");
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
      cy.get(
        `[data-colindex=1][data-rowindex=0] .t--inlined-cell-editor`,
      ).should("not.exist");
    });

    it("1.9. should test that newRow property holds the entered data", () => {
      cy.makeColumnEditable("step");
      cy.makeColumnEditable("task");
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

    it("1.10. should test that non data (iconBitton, button, menubutton) column cells are not showing up", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      ["Button", "Menu button", "Icon button"].forEach((columnType) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option").children().contains(columnType).click();
        cy.wait("@updateLayout");
        cy.get(`[data-colindex=0][data-rowindex=0] button`).should("not.exist");
      });
      cy.get("[data-testid='t--property-pane-back-btn']").click();
    });
    it("1.11. should not hide the header section when add new row button is enabled and another header element is disabled", () => {
      cy.get(".t--discard-new-row").click({ force: true });
      //disable all header widgets for the table
      [
        "Show pagination",
        "Allow searching",
        "Allow download",
        "Allow filtering",
        "Allow adding a row",
      ].forEach((val) => {
        _.propPane.TogglePropertyState(val, "Off");
      });
      cy.wait(1000);

      //intially enable 2 sections to show pagination and "add new row" button to the header section
      _.propPane.TogglePropertyState("Show pagination", "On");
      _.propPane.TogglePropertyState("Allow adding a row", "On");

      //"add new row" button should be present
      cy.get(".t--add-new-row").should("exist");
      //turn off pagination and now the "add new row" button should be the only component left in the header section
      _.propPane.TogglePropertyState("Show pagination", "Off");
      //"add new row" should continue to be present
      cy.get(".t--add-new-row").should("exist");
      //finally turn off allow adding a row then the "add new row" button should be removed from the header section
      _.propPane.TogglePropertyState("Allow adding a row", "Off");
      cy.get(".t--add-new-row").should("not.exist");
    });
  });

  describe("Validation flow", () => {
    before(() => {
      cy.startServerAndRoutes();
      _.agHelper.RestoreLocalStorageCache();
      cy.fixture("tableV2NewDsl").then((val) => {
        _.agHelper.AddDsl(val);
      });
    });

    it("2.1. should test that validation is working for a new row cell", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--add-new-row").click();
      cy.makeColumnEditable("step");
      cy.editColumn("step");

      _.propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === '#1'}}");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "22");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "#1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      _.propPane.UpdatePropertyFieldValue("Valid", "");

      _.propPane.UpdatePropertyFieldValue("Regex", "^#1$");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "22");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "#1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      _.propPane.UpdatePropertyFieldValue("Regex", "");

      _.propPane.TogglePropertyState("Required", "On");
      cy.enterTableCellValue(0, 0, "22");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "#1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");

      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Number").click();
      cy.wait("@updateLayout");

      _.propPane.UpdatePropertyFieldValue("Min", "5");
      cy.enterTableCellValue(0, 0, "6");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "7");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "4");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "3");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "8");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      _.propPane.UpdatePropertyFieldValue("Min", "");

      _.propPane.UpdatePropertyFieldValue("Max", "5");
      cy.enterTableCellValue(0, 0, "6");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "7");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "4");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "3");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "8");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      _.propPane.UpdatePropertyFieldValue("Max", "");

      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("2.2. should test that validation variable isNewRow is working", () => {
      _.propPane.UpdatePropertyFieldValue(
        "Valid",
        "{{isNewRow ? (editedValue === 1) : (editedValue === 2)}}",
      );

      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "3");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "2");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.discardTableCellValue(0, 0);
      cy.wait(500);
      cy.get(".t--add-new-row").click();
      cy.wait(1000);
      cy.enterTableCellValue(0, 0, "3");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "2");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("2.3. should test that validation is working for more than one add new row cell at a time", () => {
      _.propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === 1}}");
      cy.get("[data-testid='t--property-pane-back-btn']").click();
      cy.wait(500);
      cy.makeColumnEditable("task");
      cy.editColumn("task");
      cy.wait(500);
      _.propPane.UpdatePropertyFieldValue(
        "Valid",
        "{{editedValue === 'invalid'}}",
      );
      _.propPane.TogglePropertyState("Required", "On");
      cy.get(".t--add-new-row").click();
      cy.get(`.t--inlined-cell-editor-has-error`).should("have.length", 2);
    });

    it("2.4. should test that validation error message only appears when a cell is in focus", () => {
      cy.get(".error-tooltip .bp3-popover-content").should("not.exist");
      cy.get(`[data-colindex=1][data-rowindex=0] input`).focus();
      cy.get(".error-tooltip .bp3-popover-content").should("have.length", 1);
      cy.openPropertyPane("tablewidgetv2");
      cy.get(".error-tooltip .bp3-popover-content").should("not.exist");
      cy.get(`[data-colindex=0][data-rowindex=0] input`).focus();
      cy.get(".error-tooltip .bp3-popover-content").should("have.length", 1);
    });

    it("2.5. should test that save button is disabled when there is an error", () => {
      cy.get(".t--save-new-row").should("be.disabled");
      cy.get(`.t--inlined-cell-editor-has-error`).should("have.length", 2);
      cy.enterTableCellValue(0, 0, "1");
      cy.wait(1000);
      cy.get(`.t--inlined-cell-editor-has-error`).should("have.length", 1);
      cy.enterTableCellValue(1, 0, "invalid");
      cy.wait(1000);
      cy.get(`.t--inlined-cell-editor-has-error`).should("have.length", 0);
      cy.get(".t--save-new-row").should("not.be.disabled");
    });
  });

  describe("Actions flow (save, discard)", () => {
    before(() => {
      cy.startServerAndRoutes();
      _.agHelper.RestoreLocalStorageCache();
      cy.fixture("tableV2NewDsl").then((val) => {
        _.agHelper.AddDsl(val);
      });
    });

    it("3.1. should test that discard button is undoing the add new feature", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".tableWrap .new-row").should("not.exist");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("3.2. should test that discard events is triggered when user clicks on the discard button", () => {
      cy.getAlert("onDiscard", "discarded!!");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--discard-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      _.agHelper.AssertContains("discarded!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });

    it("3.3. should test that save event is triggered when user clicks on the save button", () => {
      cy.getAlert("onSave", "saved!!");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--save-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      _.agHelper.AssertContains("saved!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });
  });
});
