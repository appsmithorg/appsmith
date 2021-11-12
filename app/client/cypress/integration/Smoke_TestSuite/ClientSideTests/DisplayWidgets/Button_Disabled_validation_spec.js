const dsl = require("../../../../fixtures/buttonDisabledDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Disabled Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Should be able to drag disabled button", function() {
    cy.wait(500);
    cy.get(".t--draggable-buttonwidget button")
      .wait(500)
      .realHover()
      .trigger("dragstart", { force: true });
    cy.get(explorer.dropHere)
      .trigger("mousemove", 200, 400, { eventConstructor: "MouseEvent" })
      .trigger("mousemove", 200, 400, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 200, 400, { eventConstructor: "MouseEvent" });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
