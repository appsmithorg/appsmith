const dsl = require("../../../../../fixtures/Table/InlineEditingDSL.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const propPane = ObjectsRegistry.PropertyPane;
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table widget Add new row feature's", () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  describe("Validation flow", () => {
    before(() => {
      cy.startServerAndRoutes();
      agHelper.RestoreLocalStorageCache();
      cy.addDsl(dsl);
    });

    it("2.1. should test that validation is working for a new row cell", () => {
      cy.openPropertyPane("tablewidgetv2");
      propPane.ToggleOnOrOff("Allow adding a row", "On");
      cy.get(".t--add-new-row").click();
      cy.makeColumnEditable("step");
      cy.editColumn("step");

      propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === '#1'}}");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "22");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "#1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      propPane.UpdatePropertyFieldValue("Valid", "");

      propPane.UpdatePropertyFieldValue("Regex", "^#1$");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      cy.enterTableCellValue(0, 0, "22");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("exist");
      cy.enterTableCellValue(0, 0, "#1");
      cy.wait(500);
      cy.get(`.t--inlined-cell-editor-has-error`).should("not.exist");
      propPane.UpdatePropertyFieldValue("Regex", "");

      propPane.ToggleOnOrOff("Required", "On");
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

      propPane.UpdatePropertyFieldValue("Min", "5");
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
      propPane.UpdatePropertyFieldValue("Min", "");

      propPane.UpdatePropertyFieldValue("Max", "5");
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
      propPane.UpdatePropertyFieldValue("Max", "");

      cy.get(".t--discard-new-row").click({ force: true });
    });

    it("2.2. should test that validation variable isNewRow is working", () => {
      propPane.UpdatePropertyFieldValue(
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
      propPane.UpdatePropertyFieldValue("Valid", "{{editedValue === 1}}");
      cy.get("[data-testid='t--property-pane-back-btn']").click();
      cy.wait(500);
      cy.makeColumnEditable("task");
      cy.editColumn("task");
      cy.wait(500);
      propPane.UpdatePropertyFieldValue(
        "Valid",
        "{{editedValue === 'invalid'}}",
      );
      propPane.ToggleOnOrOff("Required", "On");
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
      agHelper.RestoreLocalStorageCache();
      cy.addDsl(dsl);
    });

    it("3.1. should test that discard button is undoing the add new feature", () => {
      cy.openPropertyPane("tablewidgetv2");
      propPane.ToggleOnOrOff("Allow adding a row", "On");
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
      agHelper.AssertContains("discarded!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });

    it("3.3. should test that save event is triggered when user clicks on the save button", () => {
      cy.getAlert("onSave", "saved!!");
      cy.get(".t--add-new-row").click();
      cy.get(".tableWrap .new-row").should("exist");
      cy.get(".t--save-new-row").click({ force: true });
      cy.get(widgetsPage.toastAction).should("be.visible");
      agHelper.AssertContains("saved!!");
      cy.get(".tableWrap .new-row").should("not.exist");
    });
  });
});
