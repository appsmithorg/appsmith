const dsl = require("../../../../fixtures/disabledWidgetsDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Disabled Widgets drag Functionality", function() {
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
      .trigger("mousemove", 200, 300, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 200, 300, { eventConstructor: "MouseEvent" });

    cy.get(selector).then((button) => {
      expect("initialPosition").not.equal(button[0].getBoundingClientRect());
    });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Should be able to drag disabled menu button", function() {
    const selector = ".t--draggable-menubuttonwidget button";
    cy.wait(1000);
    cy.get(selector).then((button) => {
      cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
    });
    cy.get(selector)
      .realHover()
      .trigger("dragstart", { force: true });
    cy.get(explorer.dropHere)
      .trigger("mousemove", 600, 300, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 600, 300, { eventConstructor: "MouseEvent" });

    cy.get(selector).then((button) => {
      expect("initialPosition").not.equal(button[0].getBoundingClientRect());
    });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Should be able to drag disabled icon button", function() {
    const selector = ".t--draggable-iconbuttonwidget button";
    cy.wait(1000);
    cy.get(selector).then((button) => {
      cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
    });
    cy.get(selector)
      .realHover()
      .trigger("dragstart", { force: true });
    cy.get(explorer.dropHere)
      .trigger("mousemove", 200, 200, { eventConstructor: "MouseEvent" })
      .trigger("mouseup", 200, 200, { eventConstructor: "MouseEvent" });

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
