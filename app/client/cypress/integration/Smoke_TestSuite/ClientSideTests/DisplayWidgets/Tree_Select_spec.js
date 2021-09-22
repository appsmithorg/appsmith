const dsl = require("../../../../fixtures/TreeSelectDsl.json");

describe("Tree Select Widget", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Open Existing MultiSelectTree from created Widgets list", () => {
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Widgets)").click({
      multiple: true,
    });
    cy.get(
      ".bp3-icon-caret-right ~ .t--entity-name:contains(MultiSelectTree1)",
    ).click({
      multiple: true,
    });
  });
  it("Open Existing SingleSelectTree from created Widgets list", () => {
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Widgets)").click({
      multiple: true,
    });
    cy.get(
      ".bp3-icon-caret-right ~ .t--entity-name:contains(SingleSelectTree1)",
    ).click({
      multiple: true,
    });
  });
});
