const dsl = require("../../../../../fixtures/Table/DateCellEditingDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table widget date column inline editing functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. should check that edit check box is enabled for date type column in the columns list", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(
      `[data-rbd-draggable-id="release_date"] .t--card-checkbox input`,
    ).should("not.be.disabled");
  });

  it("2. should check that date cell edit mode can be turned on", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-general .t--property-control-editable",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-general .t--property-control-editable input[type=checkbox]",
    ).click();
    cy.get(
      `${commonlocators.TableV2Head} [data-header="release_date"] svg`,
    ).should("exist");
  });

  it("3. should check that user can edit date in table cell", () => {
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick();
    cy.get(".bp3-dateinput-popover").should("exist");
    cy.get(".t--inlined-cell-editor").should("exist");
    cy.get(".bp3-dateinput-popover [aria-label='Mon May 17 2021']").click();
    cy.get(".bp3-dateinput-popover").should("not.exist");
    cy.get(".t--inlined-cell-editor").should("not.exist");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).should("contain", "2021-05-17T00:00:00");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(".bp3-dateinput-popover").should("exist");
    cy.get(".t--inlined-cell-editor").should("exist");
    cy.get(`${commonlocators.textWidget}`).first().click();
    cy.get(".bp3-dateinput-popover").should("not.exist");
    cy.get(".t--inlined-cell-editor").should("not.exist");
    cy.get(
      `[type='CANVAS_WIDGET'] .t--widget-textwidget ${commonlocators.textWidget} span`,
    ).should(
      "contain",
      `{"revenue":42600000,"imdb_id":"tt3228774","release_date":"2021-05-17"}`,
    );
    cy.get(
      `[type='CANVAS_WIDGET'] .t--widget-textwidget+.t--widget-textwidget ${commonlocators.textWidget} span`,
    ).should(
      "contain",
      `[{"index":0,"updatedFields":{"release_date":"2021-05-17"},"allFields":{"revenue":42600000,"imdb_id":"tt3228774","release_date":"2021-05-17"}}]`,
    );
    cy.get(
      `[type='CANVAS_WIDGET'] .t--widget-textwidget+.t--widget-textwidget+.t--widget-textwidget ${commonlocators.textWidget} span`,
    ).should("contain", "[0]");
  });

  it("4. should check that changing property pane display format for date column changes date display format", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-displayformat .rc-select-show-arrow").click();
    cy.get(".t--dropdown-option").children().contains("Do MMM YYYY").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).should("contain", "17th May 2021");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-displayformat .rc-select-show-arrow").click();
    cy.get(".t--dropdown-option").children().contains("DD/MM/YYYY").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).should("contain", "17/05/2021");
  });

  it("5. should check that changing property pane first day of week changes the date picker starting day", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-firstdayofweek .t--code-editor-wrapper")
      .last()
      .click()
      .type("{backspace}1");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(
      ".bp3-datepicker .DayPicker .DayPicker-Months .DayPicker-WeekdaysRow div:first-child abbr",
    ).should("contain", "Mo");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-firstdayofweek .t--code-editor-wrapper")
      .last()
      .click()
      .type("{backspace}5");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(
      ".bp3-datepicker .DayPicker .DayPicker-Months .DayPicker-WeekdaysRow div:first-child abbr",
    ).should("contain", "Fr");
  });

  it.skip("6. should check that changing property pane time precision changes the date picker time precision", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-timeprecision .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option").children().contains("Minute").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-hour").should("exist");
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-minute").should("exist");
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-second").should(
      "not.exist",
    );

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-timeprecision .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option").children().contains("None").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(".bp3-timepicker-input-row").should("not.exist");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-timeprecision .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option").children().contains("Second").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-hour").should("exist");
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-minute").should("exist");
    cy.get(".bp3-timepicker-input-row .bp3-timepicker-second").should("exist");
  });

  it("7. should check visible property control functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-general .t--property-control-visible",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-general .t--property-control-visible input[type=checkbox]",
    ).click();
    cy.get(
      `${commonlocators.TableV2Head} [data-header="release_date"] .hidden-header`,
    ).should("exist");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-general .t--property-control-visible input[type=checkbox]",
    ).click();
    cy.get(
      `${commonlocators.TableV2Head} [data-header="release_date"] .draggable-header`,
    ).should("exist");
  });

  it("8. should check Show Shortcuts property control functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts input[type=checkbox]",
    ).click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(`.bp3-dateinput-popover .bp3-daterangepicker-shortcuts`).should(
      "not.exist",
    );

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts input[type=checkbox]",
    ).click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).dblclick({
      force: true,
    });
    cy.get(`.bp3-dateinput-popover .bp3-daterangepicker-shortcuts`).should(
      "exist",
    );
  });
});
