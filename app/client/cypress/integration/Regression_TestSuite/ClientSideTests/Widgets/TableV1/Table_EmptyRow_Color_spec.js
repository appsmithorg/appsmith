const dsl = require("../../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Table Widget empty row color validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate cell background of columns", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // give general color to all table row
    cy.selectColor("cellbackgroundcolor", -17);

    cy.editColumn("id");
    // Click on cell background color
    cy.selectColor("cellbackground", -27);
    cy.wait("@updateLayout");
    cy.get(commonlocators.editPropBackButton).click({ force: true });
    cy.wait(1000);
    cy.editColumn("email");
    cy.selectColor("cellbackground", -33);
    cy.wait("@updateLayout");
    cy.get(commonlocators.editPropBackButton).click({ force: true });

    // Verify the cell background color of first column
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background-color",
      "rgb(99, 102, 241)",
    );
    // Verify the cell background color of second column
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(30, 58, 138)",
    );
  });
  it("2. Validate empty row background", function() {
    // first cell of first row should be transparent
    cy.get(
      ".t--widget-tablewidget .tbody div[data-cy='empty-row-0-cell-0']",
    ).should("have.css", "background-color", "rgb(99, 102, 241)");
    // second cell of first row should be transparent
    cy.get(
      ".t--widget-tablewidget .tbody div[data-cy='empty-row-0-cell-1']",
    ).should("have.css", "background-color", "rgb(30, 58, 138)");
  });
});
