import * as _ from "../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../locators/commonlocators.json");

describe(
  "Test Create Api and Bind to Table widget V2",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("TableV2ClientSearch");
    });

    it("1. Validate onSearchTextChanged function is called when configured for search text", function () {
      cy.wait(5000);
      // input text in search bar
      cy.get(".t--widget-tablewidgetv2 .t--search-input input")
        .first()
        .type("2");
      cy.wait(5000);
      // Verify it filtered the table
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#2");
      });
      _.table.ExpandIfCollapsedSection("search\\&filters");
      // Input onsearchtextchanged control
      cy.get(".t--property-control-onsearchtextchanged .t--js-toggle")
        .first()
        .click();
      cy.testJsontext("onsearchtextchanged", "{{showAlert('12')}}");
      // Verify ClientSideSearch toggle is visible
      cy.get(".t--property-control-clientsidesearch").should("exist");

      // Verify filter still works
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#2");
      });
      // Disable Client Search
      _.agHelper.CheckUncheck(commonlocators.clientSideSearch, false);
      cy.wait(1000); //wait & then read the table value
      // Verify Client Search doesnt work
      cy.readTableV2dataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#1");
      });
    });
  },
);
