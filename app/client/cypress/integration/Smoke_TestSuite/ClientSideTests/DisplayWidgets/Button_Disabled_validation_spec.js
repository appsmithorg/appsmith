const dsl = require("../../../../fixtures/buttonDisabledDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Button-Name validation", function() {
    cy.openPropertyPane("buttonwidget");
    cy.wait(500);
    cy.get(".t--draggable-buttonwidget")
      .trigger("dragstart", { force: true })
      .trigger("mousemove", 200, 400, { force: true });
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
