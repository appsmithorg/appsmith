const dsl = require("../../../../fixtures/previewMode.json");

describe("Preview mode functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks entity explorer and property pane visiblity", function() {
    cy.get(".t--switch-preview-mode-toggle").click();

    // in preview mode, entity explorer and property pane are not visible
    cy.get(".t--entity-explorer").should("not.be.visible");
    cy.get(".t--property-pane-sidebar").should("not.be.visible");
  });

  it("checks if widgets can be selected or not", function() {
    // in preview mode, entity explorer and property pane are not visible
    const selector = `.t--draggable-buttonwidget`;
    cy.wait(500);
    cy.get(selector)
      .first()
      .trigger("mouseover", { force: true })
      .wait(500);

    cy.get(
      `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
    ).should("not.exist");
  });
});
