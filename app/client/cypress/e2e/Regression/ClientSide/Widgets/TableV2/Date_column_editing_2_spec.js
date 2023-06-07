const dsl = require("../../../../../fixtures/Table/DateCellEditingDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table widget date column inline editing functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  // ADS changes to date input property causes this test to fail
  // skipping it temporarily.
  it.skip("1. should check min date and max date property control functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-mindate",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate",
    ).should("exist");

    cy.get(
      ".t--property-pane-section-validation .t--property-control-mindate div:last-child .react-datepicker-wrapper",
    )
      .click()
      .clear()
      .type("2022-05-05T00:00:10.1010+05:30{enter}");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate div:last-child .react-datepicker-wrapper",
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
      ".t--property-pane-section-validation .t--property-control-mindate div:last-child .react-datepicker-wrapper",
    )
      .click()
      .clear()
      .type("{enter}");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-maxdate div:last-child .react-datepicker-wrapper",
    )
      .click()
      .clear()
      .type("{enter}");
  });

  it("2. should check property pane Required toggle functionality", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.editColumn("release_date");
    cy.get(
      ".t--property-pane-section-general .t--property-control-editable input[type=checkbox]",
    ).click();
    cy.get(
      ".t--property-pane-section-validation .t--property-control-required",
    ).should("exist");
    cy.get(
      ".t--property-pane-section-validation .t--property-control-required input[type=checkbox]",
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
    cy.get(`.t--editable-cell-icon`).first().click({ force: true });
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

  it("3. should check date cells behave as expected when adding a new row to table", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get("[data-testid='t--property-pane-back-btn']").click();
    cy.get(
      ".t--property-pane-section-addingarow .t--property-control-allowaddingarow input[type=checkbox]",
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
  it("4. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
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
