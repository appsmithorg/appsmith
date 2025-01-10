import * as _ from "../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../locators/commonlocators.json");

describe(
  "Test Create Api and Bind to Table widget",
  { tags: ["@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("TableClientSearch");
    });

    it("Validate onSearchTextChanged function is called when configured for search text", function () {
      cy.get(".t--widget-tablewidget .t--search-input").should("be.visible");
      // input text in search bar
      cy.get(".t--widget-tablewidget .t--search-input input")
        .first()
        .click()
        .type("2");
      cy.get(".tbody").should("be.visible");
      // Verify it filtered the table
      cy.readTabledataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#2");
      });
      // Input onsearchtextchanged control
      cy.get(".t--property-control-onsearchtextchanged .t--js-toggle")
        .first()
        .click();
      cy.testJsontext("onsearchtextchanged", "{{showAlert('12')}}");
      // Verify ClientSideSearch toggle is visible
      cy.get(".t--property-control-enableclientsidesearch").should("exist");

      // Verify filter still works
      cy.readTabledataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#2");
      });
      // Disable Client Search
      _.agHelper.CheckUncheck(commonlocators.enableClientSideSearch, false);
      cy.get(".tbody").should("be.visible"); //wait for table to update
      // Verify Client Search doesnt work
      cy.readTabledataPublish("0", "0").then((tabData) => {
        expect(tabData).to.eq("#1");
      });
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
