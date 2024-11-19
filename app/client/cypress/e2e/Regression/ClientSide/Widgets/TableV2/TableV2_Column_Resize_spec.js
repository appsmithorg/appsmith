/* eslint-disable cypress/no-unnecessary-waiting */
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Functionality with Hidden and Resized Columns",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2ResizedColumnsDsl");
    });

    it("1. Table Widget Functionality with Hidden and Resized Columns", function () {
      _.deployMode.DeployApp();
      // Verify column header width should be equal to table width
      cy.get(".t--widget-tablewidgetv2")
        .invoke("outerWidth")
        .then((tableWidth) => {
          cy.get(".t--widget-tablewidgetv2 .thead .tr")
            .invoke("outerWidth")
            .then((columnHeaderWidth) => {
              expect(columnHeaderWidth).to.be.at.least(tableWidth - 8);
            });
        });
    });
  },
);
