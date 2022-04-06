const dsl = require("../../../../fixtures/TableClientSearch.json");

describe("Test Create Api and Bind to Table widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate onSearchTextChanged function is called when configured for search text", function() {
    cy.wait(5000);
    // input text in search bar
    cy.get(".t--widget-tablewidget .t--search-input input")
      .first()
      .type("2");
    cy.wait(5000);
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
    cy.togglebarDisable(
      ".t--property-control-enableclientsidesearch input[type='checkbox']",
    );
    cy.wait(1000); //wait & then read the table value
    // Verify Client Search doesnt work
    cy.readTabledataPublish("0", "0").then((tabData) => {
      expect(tabData).to.eq("#1");
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
