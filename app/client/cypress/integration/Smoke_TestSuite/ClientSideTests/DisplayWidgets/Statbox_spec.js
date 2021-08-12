const dsl = require("../../../../fixtures/StatboxDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Statbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Open Existing Statbox from created Widgets list", () => {
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Widgets)").click({
      multiple: true,
    });
    cy.get(".bp3-icon-caret-right ~ .t--entity-name:contains(Statbox1)").click({
      multiple: true,
    });
  });
});
