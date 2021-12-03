const dsl = require("../../../../fixtures/TreeSelectDsl.json");

describe("Tree Select Widget", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Open Existing MultiSelectTree from created Widgets list", () => {
    cy.get(".widgets").click();
    cy.get(".t--entity-name:contains(MultiSelectTree1)").click();
  });
  it("Open Existing SingleSelectTree from created Widgets list", () => {
    cy.get(".widgets").click();
    cy.get(".t--entity-name:contains(SingleSelectTree1)").click();
  });
});
