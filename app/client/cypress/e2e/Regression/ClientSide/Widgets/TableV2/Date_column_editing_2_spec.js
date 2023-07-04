const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table widget date column inline editing functionality", () => {
  before(() => {
    _.agHelper.AddDsl("Table/DateCellEditingDSL");
  });

  it.skip("1. should check that changing property pane time precision changes the date picker time precision", () => {
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

  it("2. should check visible property control functionality", () => {
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

  // ADS changes to date input property causes this test to fail
  // skipping it temporarily.
  it.skip("3. should check min date and max date property control functionality", () => {
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

  it("4. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
    cy.openPropertyPane("tablewidgetv2");
    cy.get(commonlocators.editPropBackButton).click();
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
