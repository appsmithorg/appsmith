import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Property pane connections error state",
  { tags: ["@tag.PropertyPane"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("TextTabledsl");
    });

    it("1. Check if the connection shows an error state when a connection has an error", function () {
      _.propPane.openPropertyPane("tablewidget");

      cy.testJsontext("tabledata", "{{error}}");

      _.propPane.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{Table1.searchText}}");

      // Find class which indicates an error
      cy.get(".t--connection-error");
    });
  },
);
