import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Validation flow",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Sanity"] },
  () => {
    before(() => {
      cy.startServerAndRoutes();
      _.agHelper.RestoreLocalStorageCache();
      _.agHelper.AddDsl("Table/InlineEditingDSL");
    });

    it("2.1. should test that validation is working for a new row cell", () => {
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.TogglePropertyState("Allow adding a row", "On");
      cy.get(".t--add-new-row").click();
      _.table.toggleColumnEditableViaColSettingsPane("step", "v2", true, false);

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

      // check that date isRequired validation is working
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Date").click();
      cy.wait("@updateLayout");
      cy.enterTableCellValue(0, 0, "");
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");

      // revert to Number for remainder of tests
      cy.get(commonlocators.changeColType).last().click();
      cy.get(".t--dropdown-option").children().contains("Number").click();
      cy.wait("@updateLayout");

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
      _.table.toggleColumnEditableViaColSettingsPane("task", "v2", true, false);
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
      // save button is disabled when there is an error
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
  },
);
