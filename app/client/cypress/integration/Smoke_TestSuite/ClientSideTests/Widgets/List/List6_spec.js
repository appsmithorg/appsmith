const dsl = require("../../../../../fixtures/ListVulnerabilityDSL.json");

describe("Binding the list widget with text widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate text widget data based on changes in list widget Data2", function() {
    cy.PublishtheApp();
    cy.wait(5000);
  });
});
