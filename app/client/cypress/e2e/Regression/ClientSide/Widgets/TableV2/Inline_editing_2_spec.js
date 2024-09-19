import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";
import PageList from "../../../../../support/Pages/PageList";
const publish = require("../../../../../locators/publishWidgetspage.json");

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

    it("1. should check that onDiscard event is working", () => {
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.editColumn("EditActions1");
      cy.get(widgetsPage.propertyPaneSaveButton).click();
      cy.getAlert("onDiscard", "discarded!!");
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "NewValue");
      cy.openPropertyPane("tablewidgetv2");
      cy.discardTableRow(4, 0);
      cy.get(widgetsPage.toastAction).should("be.visible");
      cy.get(widgetsPage.toastActionText)
        .last()
        .invoke("text")
        .then((text) => {
          expect(text).to.equal("discarded!!");
        });
    });

    it("2. should check that inline editing works with text wrapping disabled", () => {
      agHelper.AddDsl("Table/InlineEditingDSL");
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.editTableCell(0, 0);
      cy.get(widgetsPage.firstEditInput).should("not.be.disabled");
    });

    it("3. should check that inline editing works with text wrapping enabled", () => {
      cy.openPropertyPane("tablewidgetv2");
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      cy.editColumn("step");
      cy.get(widgetsPage.cellControlSwitch).first().click({ force: true });
      cy.editTableCell(0, 0);
      cy.get(widgetsPage.firstEditInput).should("not.be.disabled");
    });

    it("4. should check that cell column height doesn't grow taller when text wrapping is disabled", () => {
      const DEFAULT_NON_WRAP_CELL_COLUMN_HEIGHT = 28;
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      table.EditTableCell(0, 0, "", false);
      agHelper.GetHeight(table._editCellEditor);
      cy.get("@eleHeight").then(($initiaHeight) => {
        expect(Number($initiaHeight.toFixed())).to.eq(
          DEFAULT_NON_WRAP_CELL_COLUMN_HEIGHT,
        );
        table.EditTableCell(
          1,
          0,
          "this is a very long cell value to check the height of the cell is growing accordingly",
          false,
        );
        agHelper.GetHeight(table._editCellEditor);
        cy.get("@eleHeight").then(($newHeight) => {
          expect(Number($newHeight)).to.eq(Number($initiaHeight));
        });
      });
    });

    it("5. should check that cell column height grows taller when text wrapping is enabled", () => {
      const MIN_WRAP_CELL_COLUMN_HEIGHT = 34;
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      table.EditColumn("step");
      propPane.TogglePropertyState("Cell Wrapping", "On");
      table.EditTableCell(
        0,
        0,
        "this is a very long cell value to check the height of the cell is growing accordingly",
        false,
      );
      agHelper.GetHeight(table._editCellEditor);
      cy.get("@eleHeight").then(($newHeight) => {
        expect(Number($newHeight)).to.be.greaterThan(
          MIN_WRAP_CELL_COLUMN_HEIGHT,
        );
      });
    });

    it("6. should check if updatedRowIndex is getting updated for single row update mode", () => {
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(publish.textWidget).should("exist");
      cy.updateCodeInput(PROPERTY_SELECTOR.text, `{{Table1.updatedRowIndex}}`);

      cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
      cy.get(widgetsPage.widgetBtn).should("exist");
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(PROPERTY_SELECTOR.jsToggle)
        .click();
      cy.updateCodeInput(widgetsPage.propertyControlLabel, "Reset");
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onClick,
        `{{resetWidget("Table1",true)}}`,
      );

      // case 1: check if updatedRowIndex has -1 as the default value:
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

      cy.openPropertyPane("tablewidgetv2");

      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);

      // case 2: check if updatedRowIndex is 0, when cell at row 0 is updated.
      cy.editTableCell(0, 0);
      cy.enterTableCellValue(0, 0, "#12").type("{enter}");
      cy.get(commonlocators.textWidgetContainer).should("contain.text", 0);

      // case 3: check if updatedRowIndex is -1 when changes are discarded.
      cy.discardTableRow(4, 0);
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

      // case 4: check if the updateRowIndex is -1 when widget is reset
      cy.editTableCell(0, 1);
      cy.enterTableCellValue(0, 1, "#13").type("{enter}");
      cy.contains("Reset").click({ force: true });
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

      // case 5: check if the updatedRowIndex changes to -1 when the table data changes.
      cy.editTableCell(0, 2);
      cy.enterTableCellValue(0, 2, "#14").type("{enter}");
      cy.openPropertyPane("tablewidgetv2");
      cy.get(widgetsPage.tabedataField).type("{cmd}{a} {backspace}");
      cy.wait(300);
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
    });

    it("7. should check if updatedRowIndex is getting updated for multi row update mode", () => {
      PageList.AddNewPage("New blank page");
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 350, y: 500 });
      table.AddSampleTableData();
      cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
      cy.get(publish.textWidget).should("exist");
      cy.updateCodeInput(PROPERTY_SELECTOR.text, `{{Table1.updatedRowIndex}}`);
      cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
      cy.get(widgetsPage.widgetBtn).should("exist");
      cy.get(PROPERTY_SELECTOR.onClick)
        .find(PROPERTY_SELECTOR.jsToggle)
        .click();
      cy.updateCodeInput(widgetsPage.propertyControlLabel, "Reset");
      propPane.EnterJSContext(
        "onClick",
        '{{resetWidget("Table1",true)}}',
        true,
        false,
      );

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.toggleColumnEditableViaColSettingsPane("step", "v2", true, true);
      agHelper.GetNClick(table._updateMode("Multi"), 0, false, 1000);

      // case 1: check if updatedRowIndex is 0, when cell at row 0 is updated.
      table.EditTableCell(0, 0, "#12");
      cy.get(commonlocators.textWidgetContainer).should("contain.text", 0);

      // case 2: check if the updateRowIndex is -1 when widget is reset
      table.EditTableCell(1, 0, "#13");
      cy.get(commonlocators.textWidgetContainer).should("contain.text", 1);

      cy.contains("Reset").click({ force: true });
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

      // case 3: check if the updatedRowIndex changes to -1 when the table data changes.
      table.EditTableCell(2, 0, "#14");
      cy.get(commonlocators.textWidgetContainer).should("contain.text", 2);
      cy.openPropertyPane("tablewidgetv2");
      cy.get(widgetsPage.tabedataField).type("{cmd}{a} {backspace}");
      cy.wait(300);
      cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
    });
  },
);
