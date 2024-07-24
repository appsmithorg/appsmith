import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Checkbox Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Checkbox"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });
    it("Add new widget", () => {
      cy.dragAndDropToCanvas("checkboxwidget", { x: 300, y: 300 });
      cy.get(".t--widget-checkboxwidget").should("exist");
    });
    it("Checkbox and it's label should be aligned in center", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.get(".sc-hINMOq").click({ force: true });
      cy.get("#radix-61-trigger-style > .sc-bcXHqe").click({ force: true });

      _.propPane.EnterJSContext("Font size", "");
      _.propPane.EnterJSContext("Font size", "4rem");

      cy.get(".bp3-control").should("have.css", "align-items", "center");
    });
  },
);