const dsl = require("../../../../fixtures/jsonFormDslWithSchema.json");

describe("Property pane js enabled field", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Ensure text is visible for js enabled field when a section is collapsed by default", function() {
    cy.openPropertyPane("jsonformwidget");
    cy.moveToStyleTab();
    cy.wait(500);
    //cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click({force:true});
    cy.get(".t--property-control-buttonvariant")
      .find(".t--js-toggle")
      .first()
      .click({ force: true });
    cy.get(".t--property-control-buttonvariant")
      .find(".t--js-toggle")
      .first()
      .should("have.class", "is-active");
    cy.testJsontext("buttonvariant", "PRIMARY");
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.closePropertyPane();
    cy.wait(1000);

    cy.openPropertyPane("jsonformwidget");
    cy.moveToStyleTab();
    cy.wait(500);
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");
  });
});
