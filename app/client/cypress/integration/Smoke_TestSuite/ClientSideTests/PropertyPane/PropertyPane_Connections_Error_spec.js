const dsl = require("../../../../fixtures/TextTabledsl.json");
var appId = " ";

describe("Property pane connections error state", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("Check if the connection shows an error state when a connection has an error", function() {
    cy.openPropertyPane("tablewidget");

    cy.testJsontext("tabledata", "{{error}}");

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.searchText}}");

    // Find class which indicates an error
    cy.get(".t--connection-error");
  });
});
