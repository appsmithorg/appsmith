const dsl = require("../../../../fixtures/formHasChangesDsl.json");

describe("Form Widget", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check hasChanges meta property", () => {
    cy.wait(2000);
    // Check if isDirty is false for the first time
    cy.contains(".t--widget-textwidget", "false").should("exist");
    // Interact with UI
    cy.get(`.t--widget-checkboxwidget label`)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.contains(".t--widget-textwidget", "false").should("not.exist");
    cy.contains(".t--widget-textwidget", "true").should("exist");
  });
});
