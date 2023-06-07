const dsl = require("../../../../../fixtures/Table/InlineEditingDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table widget inline editing functionality", () => {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.addDsl(dsl);
  });

  let propPaneBack = "[data-testid='t--property-pane-back-btn']";

  it("1. should check that onDiscard event is working", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("EditActions1");
    cy.get(".t--property-pane-section-collapse-savebutton").click();
    //cy.get(".t--property-pane-section-collapse-discardbutton").click();
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
    cy.addDsl(dsl);
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");
  });

  it("3. should check that inline editing works with text wrapping enabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-cellwrapping .ads-v2-switch")
      .first()
      .click({ force: true });
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex=0][data-rowindex=0] .t--inlined-cell-editor input.bp3-input",
    ).should("not.be.disabled");
  });

  it("4. should check that doesn't grow taller when text wrapping is disabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex='0'][data-rowindex='0'] .t--inlined-cell-editor",
    ).should("have.css", "height", "32px");
    cy.enterTableCellValue(0, 0, "this is a very long cell value");
    cy.get(
      "[data-colindex='0'][data-rowindex='0'] .t--inlined-cell-editor",
    ).should("have.css", "height", "32px");
  });

  it("5. should check that grows taller when text wrapping is enabled", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.makeColumnEditable("step");
    cy.editColumn("step");
    cy.get(".t--property-control-cellwrapping .ads-v2-switch").click({
      force: true,
    });
    cy.editTableCell(0, 0);
    cy.get(
      "[data-colindex='0'][data-rowindex='0'] .t--inlined-cell-editor",
    ).should("have.css", "height", "34px");
    cy.enterTableCellValue(0, 0, "this is a very long cell value");
    cy.get(
      "[data-colindex='0'][data-rowindex='0'] .t--inlined-cell-editor",
    ).should("not.have.css", "height", "34px");
  });

  it("6. should check if updatedRowIndex is getting updated for single row update mode", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(".t--widget-textwidget").should("exist");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.updatedRowIndex}}`,
    );

    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.get(".t--widget-buttonwidget").should("exist");
    cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-label", "Reset");
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Table1",true)}}`,
    );

    // case 1: check if updatedRowIndex has -1 as the default value:
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    cy.openPropertyPane("tablewidgetv2");

    cy.makeColumnEditable("step");
    cy.wait(1000);

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
    cy.wait(1000);
    cy.editTableCell(0, 2);
    cy.enterTableCellValue(0, 2, "#14").type("{enter}");
    cy.openPropertyPane("tablewidgetv2");
    cy.get(widgetsPage.tabedataField).type("{backspace}");
    cy.wait(300);
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
  });

  it("7. should check if updatedRowIndex is getting updated for multi row update mode", () => {
    cy.dragAndDropToCanvas("textwidget", { x: 400, y: 400 });
    cy.get(".t--widget-textwidget").should("exist");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Table1.updatedRowIndex}}`,
    );

    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.get(".t--widget-buttonwidget").should("exist");
    cy.get(PROPERTY_SELECTOR.onClick).find(".t--js-toggle").click();
    cy.updateCodeInput(".t--property-control-label", "Reset");
    cy.updateCodeInput(
      PROPERTY_SELECTOR.onClick,
      `{{resetWidget("Table1",true)}}`,
    );

    cy.openPropertyPane("tablewidgetv2");

    cy.makeColumnEditable("step");
    cy.get(".ads-v2-segmented-control-value-CUSTOM").click({ force: true });
    cy.wait(1000);

    // case 1: check if updatedRowIndex is 0, when cell at row 0 is updated.
    cy.editTableCell(0, 0);
    cy.enterTableCellValue(0, 0, "#12").type("{enter}");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 0);

    // case 2: check if the updateRowIndex is -1 when widget is reset
    cy.editTableCell(0, 1);
    cy.enterTableCellValue(0, 1, "#13").type("{enter}");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 1);
    cy.contains("Reset").click({ force: true });
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);

    // case 3: check if the updatedRowIndex changes to -1 when the table data changes.
    cy.wait(1000);
    cy.editTableCell(0, 2);
    cy.enterTableCellValue(0, 2, "#14").type("{enter}");
    cy.get(commonlocators.textWidgetContainer).should("contain.text", 2);
    cy.openPropertyPane("tablewidgetv2");
    cy.get(widgetsPage.tabedataField).type("{backspace}");
    cy.wait(300);
    cy.get(commonlocators.textWidgetContainer).should("contain.text", -1);
  });
});
