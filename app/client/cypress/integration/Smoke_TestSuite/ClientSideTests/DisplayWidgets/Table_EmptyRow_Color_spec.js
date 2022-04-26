const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Table Widget empty row color validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate cell background of columns", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");

    cy.editColumn("id");
    // Click on cell background color
    cy.get(widgetsPage.backgroundColor)
      .first()
      .scrollIntoView()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // select the green color
    cy.get(widgetsPage.greenColor)
      .last()
      .click();
    cy.wait("@updateLayout");
    cy.get(commonlocators.editPropBackButton).click({ force: true });

    cy.editColumn("email");
    // Click on cell background color
    cy.get(widgetsPage.backgroundColor)
      .first()
      .scrollIntoView()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // select the blue color
    cy.xpath(widgetsPage.blueColor)
      .last()
      .click();
    cy.wait("@updateLayout");
    cy.get(commonlocators.editPropBackButton).click({ force: true });

    // Verify the cell background color is green
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background-color",
      "rgb(3, 179, 101)",
    );
    // Verify the cell background color is blue
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(51, 102, 255)",
    );
  });
  it("2. Validate empty row background", function() {
    // first cell of first row should be transparent
    cy.get(
      ".t--widget-tablewidget .tbody div[data-cy='empty-row-0-cell-0']",
    ).should("have.css", "background-color", "rgba(0, 0, 0, 0)");
    // second cell of first row should be transparent
    cy.get(
      ".t--widget-tablewidget .tbody div[data-cy='empty-row-0-cell-1']",
    ).should("have.css", "background-color", "rgba(0, 0, 0, 0)");
  });
});
