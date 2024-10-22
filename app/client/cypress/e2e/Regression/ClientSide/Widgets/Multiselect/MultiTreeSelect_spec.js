import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Multi Tree Select Widget",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });

    it("Add new widget", () => {
      cy.dragAndDropToCanvas("multiselecttreewidget", { x: 300, y: 300 });
      cy.get(".t--widget-multiselecttreewidget").should("exist");
    });

    it("should check that empty value is allowed in options", () => {
      cy.openPropertyPane("multiselecttreewidget");
      cy.updateCodeInput(
        ".t--property-control-options",
        `[
        {
          "label": "Blue",
          "value": "",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
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
      cy.get(".t--property-control-options .t--codemirror-has-error").should(
        "not.exist",
      );
    });

    it("should check that more thatn empty value is not allowed in options", () => {
      cy.openPropertyPane("multiselecttreewidget");
      cy.updateCodeInput(
        ".t--property-control-options",
        `[
        {
          "label": "Blue",
          "value": "",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
        },
        {
          "label": "Green",
          "value": ""
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
      );
      cy.get(".t--property-control-options .t--codemirror-has-error").should(
        "exist",
      );
    });
  },
);
