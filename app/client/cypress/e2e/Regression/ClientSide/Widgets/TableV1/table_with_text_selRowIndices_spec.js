const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table widget edge case scenario testing",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableWithTextWidgetDsl");
    });

    it("Check if the selectedRowIndices does not contain -1", function () {
      cy.openPropertyPane("tablewidget");

      //Update the property default selected row to blank
      cy.updateCodeInput(".t--property-control-defaultselectedrow", "");

      // ensure evaluated value popup does not show up
      cy.get(commonlocators.evaluatedCurrentValue).should("not.exist");

      //Check the value present in the textfield which is selectedRowIndices is blank
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should("have.text", "");

      //Enable the "Enable Multi Row selection"
      cy.get(widgetsPage.toggleEnableMultirowselection_tablev1)
        .first()
        .click({ force: true });

      //Check the value present in the textfield which is selectedRowIndices is []
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[]",
      );

      //Select the 1st, 2nd and 3rd row
      _.table.SelectTableRow(0);
      _.table.SelectTableRow(1);
      _.table.SelectTableRow(2);

      //Check the value present in the textfield which is selectedRowIndices is [0,1,2]
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.text",
        "[  0,  1,  2]",
      );
    });
  },
);
//
