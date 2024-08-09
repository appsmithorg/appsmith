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
      const checkboxLabel = ".sc-hINMOq";
      const triggerStyle = "#radix-61-trigger-style > .sc-bcXHqe";
      cy.get(checkboxLabel).click({ force: true });
      cy.get(triggerStyle).click({ force: true });
      _.propPane.EnterJSContext("Font size", "");
      _.propPane.EnterJSContext("Font size", "4rem");
      const checkboxControl = ".bp3-control";
      cy.get(checkboxControl).should("have.css", "align-items", "center");
      cy.get(checkboxControl).should("exist");
    });
  },
);