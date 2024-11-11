const explorer = require("../../../../locators/explorerlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Disabled Widgets drag Functionality",
  { tags: ["@tag.Widget", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("disabledWidgetsDsl");
    });

    it("Button widget", function () {
      const selector = ".t--draggable-buttonwidget button";
      cy.wait(1000);
      cy.get(selector).then((button) => {
        cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
      });
      cy.get(selector)
        .first()
        .realHover()
        .trigger("dragstart", { force: true });
      cy.get(explorer.dropHere)
        .first()
        .trigger("mousemove", 200, 300, { eventConstructor: "MouseEvent" })
        .trigger("mousemove", 200, 300, { eventConstructor: "MouseEvent" });
      _.agHelper.Sleep(200);
      cy.get(explorer.dropHere)
        .first()
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

    it("Menu-Button widget", function () {
      const selector = ".t--draggable-menubuttonwidget button";
      cy.wait(1000);
      cy.get(selector).then((button) => {
        cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
      });
      cy.get(selector)
        .first()
        .realHover()
        .trigger("dragstart", { force: true });
      cy.get(explorer.dropHere)
        .first()
        .trigger("mousemove", 600, 300, { eventConstructor: "MouseEvent" })
        .trigger("mousemove", 600, 300, { eventConstructor: "MouseEvent" });
      _.agHelper.Sleep(200);
      cy.get(explorer.dropHere)
        .first()
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

    it("Icon widget", function () {
      const selector = ".t--draggable-iconbuttonwidget button";
      cy.wait(1000);
      cy.get(selector).then((button) => {
        cy.wrap(button[0].getBoundingClientRect()).as("initialPosition");
      });

      cy.get(selector)
        .first()
        .realHover()
        .trigger("dragstart", { force: true });
      cy.get(explorer.dropHere)
        .first()
        .trigger("mousemove", 200, 200, { eventConstructor: "MouseEvent" })
        .trigger("mousemove", 200, 200, { eventConstructor: "MouseEvent" });
      _.agHelper.Sleep(200);
      cy.get(explorer.dropHere)
        .first()
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
  },
);
