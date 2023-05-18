const dsl = require("../../../../../fixtures/Table/DateCellEditingDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import { PROPERTY_SELECTOR } from "../../../../../locators/WidgetLocators";
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
      ".t--property-pane-section-general .t--property-control-editable input[type=checkbox]+span",
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
    cy.get(".t--property-control-displayformat .bp3-popover-target")
      .last()
      .click();
    cy.get(".t--dropdown-option").children().contains("Do MMM YYYY").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3)`,
    ).should("contain", "17th May 2021");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(".t--property-control-displayformat .bp3-popover-target")
      .last()
      .click();
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
      ".t--property-pane-section-general .t--property-control-visible input[type=checkbox]+span",
    ).click();
    cy.get(
      `${commonlocators.TableV2Head} [data-header="release_date"] .hidden-header`,
    ).should("exist");

    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-general .t--property-control-visible input[type=checkbox]+span",
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
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts input[type=checkbox]+span",
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
      ".t--property-pane-section-datesettings .t--property-control-showshortcuts input[type=checkbox]+span",
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

  it("9. should check min date and max date property control functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-mindate",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate",
    ).should("exist");

    cy.get(
      ".t--property-pane-section-validation .t--property-control-mindate div:last-child .bp3-popover-wrapper",
    )
      .click()
      .clear()
      .type("2022-05-05T00:00:10.1010+05:30{enter}");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate div:last-child .bp3-popover-wrapper",
    )
      .click()
      .clear()
      .type("2022-05-30T00:00:10.1010+05:30{enter}");

    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) .td:nth-child(3)`,
    ).realHover();
    cy.get(`.t--editable-cell-icon`).first().click({
      force: true,
    });
    cy.get(
      ".bp3-transition-container .bp3-popover .bp3-popover-content",
    ).should("contain", "Date out of range");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-mindate div:last-child .bp3-popover-wrapper",
    )
      .click()
      .clear()
      .type("{enter}");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate div:last-child .bp3-popover-wrapper",
    )
      .click()
      .clear()
      .type("{enter}");
  });

  it("10. should check property pane Required toggle functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-required",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-required input[type=checkbox]+span",
    ).click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) .td:nth-child(3)`,
    ).realHover();
    cy.get(`.t--editable-cell-icon`).first().click({
      force: true,
    });
    cy.get(".bp3-dateinput-popover [aria-label='Wed May 26 2021']").click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) .td:nth-child(3)`,
    ).realHover();
    cy.get(`.t--editable-cell-icon`).first().click({});
    cy.get(".bp3-dateinput-popover [aria-label='Wed May 26 2021']").click();
    cy.get(
      ".bp3-transition-container .bp3-popover .bp3-popover-content",
    ).should("exist");
    cy.get(
      ".bp3-transition-container .bp3-popover .bp3-popover-content",
    ).should("contain", "This field is required");
    cy.get(".bp3-dateinput-popover [aria-label='Wed May 26 2021']").click();
    cy.get(
      ".bp3-transition-container .bp3-popover .bp3-popover-content",
    ).should("not.exist");
  });

  it("11. should check date cells behave as expected when adding a new row to table", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(".t--property-pane-back-btn").click();
    cy.get(
      ".t--property-pane-section-addingarow .t--property-control-allowaddingarow input[type=checkbox]+span",
    ).click();
    cy.get(".t--add-new-row").click();
    cy.get(".bp3-datepicker").should("not.exist");
    cy.get(".t--inlined-cell-editor")
      .should("have.css", "border")
      .and("eq", "1px solid rgb(255, 255, 255)");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
    ).should("have.value", "");
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
    ).click();
    cy.get(".bp3-datepicker").should("exist");
    cy.get(".t--inlined-cell-editor")
      .should("have.css", "border")
      .and("not.eq", "none")
      .and("not.eq", "1px solid rgb(255, 255, 255)");
    cy.get(
      ".bp3-datepicker .DayPicker .DayPicker-Body .DayPicker-Week:nth-child(2) .DayPicker-Day:first-child",
    ).click();
    cy.get(
      `${commonlocators.TableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
    ).should("not.have.value", "");
  });
  it("11. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(".t--property-control-tabledata").then(($el) => {
      cy.updateCodeInput(
        $el,
        '[{ "dateValue": "2023-02-02T13:39:38.367857Z" }]',
      );
    });
    cy.wait(500);

    cy.editColumn("dateValue");
    //change format of column to date
    cy.changeColumnType("Date");

    cy.get(".t--property-control-dateformat").click();
    cy.contains("ISO 8601").click();
    // we should not see an error after selecting the ISO 8061 format
    cy.get(".t--property-control-dateformat .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(".t--property-control-dateformat").find(".t--js-toggle").click();
    //check the selected format value
    cy.get(".t--property-control-dateformat").contains(
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
    );
    cy.get(".t--property-control-dateformat").then(($el) => {
      //give a corrupted date format
      cy.updateCodeInput($el, "YYYY-MM-DDTHH:mm:ss.SSSsZ");
    });
    //we should now see an error when an incorrect date format
    cy.get(".t--property-control-dateformat .t--codemirror-has-error").should(
      "exist",
    );
  });
});
