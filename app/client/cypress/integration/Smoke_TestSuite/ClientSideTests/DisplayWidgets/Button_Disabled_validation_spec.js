const dsl = require("../../../../fixtures/buttonDisabledDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Disabled Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Should be able to drag disabled button", function() {
    const selector = ".t--draggable-buttonwidget button";
    cy.wait(1000);
    cy.get(selector).then((button) => {
      cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
    });
    cy.get(selector)
      .realHover()
      .trigger("dragstart", { force: true });
    cy.get(explorer.dropHere)
      .trigger("mousemove", 200, 400, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", 200, 400, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 200, 400, { eventConstructor: "MouseEvent" });

    cy.get(selector).then((button) => {
      expect("initialPosition").not.equal(button[0].getBoundingClientRect());
    });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
