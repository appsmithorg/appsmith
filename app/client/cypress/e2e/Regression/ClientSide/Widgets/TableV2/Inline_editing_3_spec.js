const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  table as tableHelper,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";

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

    let propPaneBack = "[data-testid='t--property-pane-back-btn']";

    it("1. should check that save/discard column is added/removed when inline save option is changed", () => {
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
      cy.get(".t--property-control-updatemode .t--property-control-label")
        .last()
        .click();
      cy.get(".ads-v2-segmented-control-value-CUSTOM").click({ force: true });
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
      tableHelper.toggleColumnEditableViaColSettingsPane("task");
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
      cy.get(".t--property-control-updatemode .t--property-control-label")
        .last()
        .click();
      cy.get(".ads-v2-segmented-control-value-ROW_LEVEL").click({
        force: true,
      });
      cy.get("[data-rbd-draggable-id='EditActions1']").should("exist");
      cy.get(".t--property-control-updatemode .t--property-control-label")
        .last()
        .click();
      cy.get(".ads-v2-segmented-control-value-CUSTOM").click({ force: true });
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
      tableHelper.toggleColumnEditableViaColSettingsPane(
        "step",
        "v2",
        false,
        true,
      );
      tableHelper.toggleColumnEditableViaColSettingsPane(
        "task",
        "v2",
        false,
        true,
      );
      cy.get(".t--property-control-updatemode .t--property-control-label")
        .last()
        .click();
      cy.get(".ads-v2-segmented-control-value-ROW_LEVEL").click({
        force: true,
      });
      cy.get("[data-rbd-draggable-id='EditActions1']").should("not.exist");
    });

    it("2. should check that cell of an editable column is editable", () => {
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      // click the edit icon
      cy.editTableCell(0, 0);
      cy.get(
        "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
      ).should("not.be.disabled");

      //double click the cell
      cy.openPropertyPane("tablewidgetv2");
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input`,
      ).should("not.exist");
      cy.get(`[data-colindex=0][data-rowindex=0] .t--table-text-cell`).trigger(
        "dblclick",
      );
      cy.get(
        `[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input`,
      ).should("exist");
      cy.get(
        "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
      ).should("not.be.disabled");
    });

    it("3. should check that changes can be discarded by clicking escape", () => {
      cy.openPropertyPane("tablewidgetv2");
      let value;
      cy.readTableV2data(0, 0).then((val) => {
        value = val;
      });
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "newValue");
      cy.discardTableCellValue(0, 0);
      cy.get(
        `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
      ).should("not.exist");
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.equal(value);
      });
    });

    it("4. should check that changes can be saved by pressing enter or clicking outside", () => {
      cy.openPropertyPane("tablewidgetv2");
      let value;
      cy.readTableV2data(0, 0).then((val) => {
        value = val;
      });
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "newValue");
      cy.saveTableCellValue(0, 0);
      cy.get(
        `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
      ).should("not.exist");
      cy.wait(1000);
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.not.equal(value);
        value = val;
      });
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "someOtherNewValue");
      cy.openPropertyPane("tablewidgetv2");
      cy.get(
        `[data-colindex="0"][data-rowindex="0"] .t--inlined-cell-editor input.bp3-input`,
      ).should("not.exist");
      cy.wait(1000);
      cy.readTableV2data(0, 0).then((val) => {
        expect(val).to.not.equal(value);
      });
    });

    it("5. should check that updatedRows and updatedRowIndices have correct values", () => {
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", `{{Table1.updatedRows}}`);
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "newValue");
      cy.saveTableCellValue(0, 0);
      agHelper.Sleep();
      agHelper
        .GetText(".t--widget-textwidget .bp3-ui-text", "text")
        .then((text) => {
          text = JSON.parse(text);
          const exected = JSON.parse(
            `[  {    "index": 0,    "updatedFields": {      "step": "newValue"    },    "allFields": {      "step": "newValue",      "task": "Drop a table",      "status": "✅"    }  }]`,
          );
          expect(text).to.deep.equal(exected);
        });
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{Table1.updatedRowIndices}}`,
      );
      cy.get(".t--widget-textwidget .bp3-ui-text").should("contain", "[  0]");
    });

    it("6. should check that onsubmit event is available for the columns that are editable", () => {
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("step");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(tableHelper._dropdownText)
        .children()
        .contains("Plain text")
        .click();
      propPane.TogglePropertyState("Editable", "Off", "");
      [
        {
          columnType: "URL",
          expected: "not.exist",
        },
        {
          columnType: "Number",
          expected: "not.exist",
        },
        {
          columnType: "Date",
          expected: "not.exist",
        },
        {
          columnType: "Image",
          expected: "not.exist",
        },
        {
          columnType: "Video",
          expected: "not.exist",
        },
        {
          columnType: "Button",
          expected: "not.exist",
        },
        {
          columnType: "Menu button",
          expected: "not.exist",
        },
        {
          columnType: "Icon button",
          expected: "not.exist",
        },
        {
          columnType: "Plain text",
          expected: "not.exist",
        },
      ].forEach((data) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option")
          .children()
          .contains(data.columnType)
          .click();
        cy.wait("@updateLayout");
        cy.get(PROPERTY_SELECTOR.onSubmit).should(data.expected);
      });

      cy.get(propPaneBack).click();
      tableHelper.toggleColumnEditableViaColSettingsPane(
        "step",
        "v2",
        true,
        false,
      );

      [
        {
          columnType: "URL",
          expected: "not.exist",
        },
        {
          columnType: "Number",
          expected: "exist",
        },
        {
          columnType: "Date",
          expected: "not.exist",
        },
        {
          columnType: "Image",
          expected: "not.exist",
        },
        {
          columnType: "Video",
          expected: "not.exist",
        },
        {
          columnType: "Button",
          expected: "not.exist",
        },
        {
          columnType: "Menu button",
          expected: "not.exist",
        },
        {
          columnType: "Icon button",
          expected: "not.exist",
        },
        {
          columnType: "Plain text",
          expected: "exist",
        },
      ].forEach((data) => {
        cy.get(commonlocators.changeColType).last().click();
        cy.get(".t--dropdown-option")
          .children()
          .contains(data.columnType)
          .click();
        cy.wait("@updateLayout");
        cy.get(PROPERTY_SELECTOR.onSubmit).should(data.expected);
      });
    });

    it("7. should check that onsubmit event is triggered when changes are saved", () => {
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane(
        "step",
        "v2",
        true,
        false,
      );
      cy.getAlert("onSubmit", "Submitted!!");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "NewValue");
      cy.saveTableCellValue(0, 0);

      cy.get(widgetsPage.toastAction).should("be.visible");
      cy.get(widgetsPage.toastActionText)
        .last()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal("Submitted!!");
        });
    });

    it("8. should check that onSubmit events has access to edit values through triggeredRow", () => {
      const value = "newCellValue";
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane(
        "step",
        "v2",
        true,
        false,
      );
      cy.getAlert("onSubmit", "{{Table1.triggeredRow.step}}");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, value);
      cy.saveTableCellValue(0, 0);

      cy.get(widgetsPage.toastAction).should("be.visible");
      cy.get(widgetsPage.toastActionText)
        .last()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal(value);
        });
    });

    it("9. should check that onSave is working", () => {
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.editColumn("EditActions1");
      //cy.get(".t--property-pane-section-collapse-savebutton").click({force:true});
      cy.get(".t--property-pane-section-collapse-discardbutton").click({
        force: true,
      });
      cy.getAlert("onSave", "Saved!!");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "NewValue");
      cy.openPropertyPane("tablewidgetv2");
      cy.saveTableRow(4, 0);
      cy.get(widgetsPage.toastAction).should("be.visible");
      cy.get(widgetsPage.toastActionText)
        .last()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal("Saved!!");
        });
    });

    it("10. should check that onSave events has access to edit values through triggeredRow", () => {
      cy.openPropertyPane("tablewidgetv2");
      tableHelper.toggleColumnEditableViaColSettingsPane("step");
      cy.editColumn("EditActions1");
      //cy.get(".t--property-pane-section-collapse-savebutton").click({force:true});
      cy.get(".t--property-pane-section-collapse-discardbutton").click({
        force: true,
      });
      cy.getAlert("onSave", "{{Table1.triggeredRow.step}}");
      /*
    cy.addSuccessMessage(
      "{{Table1.triggeredRow.step}}",
      ".t--property-control-onsave",
    );
    */
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "NewValue");
      cy.openPropertyPane("tablewidgetv2");
      cy.saveTableRow(4, 0);
      cy.get(widgetsPage.toastAction).should("be.visible");
      cy.get(widgetsPage.toastActionText)
        .last()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal("NewValue");
        });
    });
  },
);
