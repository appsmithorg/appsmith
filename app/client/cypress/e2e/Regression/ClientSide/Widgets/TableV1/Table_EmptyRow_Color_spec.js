import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Table Widget empty row color validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableNewDsl");
    });

    it("1. Validate cell background of columns", function () {
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
        "rgb(185, 28, 28)",
      );
      // Verify the cell background color of second column
      cy.readTabledataValidateCSS(
        "1",
        "1",
        "background-color",
        "rgb(113, 113, 122)",
      );
      //Test 2. Validate empty row background
      // first cell of first row should be transparent
      cy.get(
        ".t--widget-tablewidget .tbody div[data-testid='empty-row-0-cell-0']",
      ).should("have.css", "background-color", "rgb(185, 28, 28)");
      // second cell of first row should be transparent
      cy.get(
        ".t--widget-tablewidget .tbody div[data-testid='empty-row-0-cell-1']",
      ).should("have.css", "background-color", "rgb(113, 113, 122)");
    });
  },
);
