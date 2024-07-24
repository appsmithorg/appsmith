import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "checkboxgroupwidget Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Checkbox"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });

    it("Add new widget", () => {
      cy.dragAndDropToCanvas("checkboxgroupwidget", { x: 300, y: 300 });
      cy.get(".t--widget-checkboxgroupwidget").should("exist");
    });

    it("should check the default color as green when we remove accent color", () => {
      cy.get(":nth-child(3) > .bp3-control-indicator").click({ force: true });
      cy.get(":nth-child(3) > .bp3-control-indicator").should(
        "have.css",
        "background-color",
        "rgb(52, 25, 218)",
      );
      cy.get("#radix-61-trigger-style > .sc-bcXHqe").click({ force: true });
      _.propPane.EnterJSContext("Accent color", "");
      cy.get(":nth-child(3) > .bp3-control-indicator").should(
        "have.css",
        "background-color",
        "rgb(80, 175, 108)",
      );
    });
  },
);