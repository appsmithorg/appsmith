import * as _ from "../../../../../support/Objects/ObjectsCore";

const defaultValue = `
        {
          "label": "Green",
          "value": "GREEN"
        }
      `;

describe(
  "Select Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });
    beforeEach(() => {
      cy.wait(2000);
    });
    it("Add new Select widget", () => {
      cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
      cy.get(".t--widget-selectwidget").should("exist");
      _.propPane.ToggleJSMode("sourcedata");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
          "label": "Blue",
          "value": ""
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
      );

      _.propPane.ToggleJSMode("labelkey");
      cy.updateCodeInput(
        ".t--property-control-wrapper.t--property-control-labelkey",
        `label`,
      );

      _.propPane.ToggleJSMode("valuekey");
      cy.updateCodeInput(".t--property-control-valuekey", `value`);

      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalue",
        defaultValue,
      );
    });
  },
);
