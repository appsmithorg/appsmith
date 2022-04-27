const dsl = require("../../../../fixtures/jsonFormDslWithSchema.json");
const { ObjectsRegistry } = require("../../../../support/Objects/Registry");
let ee = ObjectsRegistry.EntityExplorer;

describe("Property pane js enabled field", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Ensure text is visible for js enabled field when a section is collapsed by default", function() {
    cy.openPropertyPane("jsonformwidget");

    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.get(".t--property-control-buttonvariant")
      .find(".t--js-toggle")
      .first()
      .click();

    cy.get(".t--property-control-buttonvariant")
      .find(".t--js-toggle")
      .first()
      .should("have.class", "is-active");

    cy.get(".t--property-control-buttonvariant .CodeMirror-code").type(
      "PRIMARY",
    );
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");

    cy.closePropertyPane();
    cy.wait(1000);

    cy.openPropertyPane("jsonformwidget");
    cy.get(".t--property-pane-section-collapse-submitbuttonstyles").click();
    cy.get(".t--property-control-buttonvariant")
      .find(".CodeMirror-code")
      .invoke("text")
      .should("equal", "PRIMARY");
  });
});
