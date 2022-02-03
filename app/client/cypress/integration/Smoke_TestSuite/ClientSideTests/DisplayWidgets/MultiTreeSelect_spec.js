const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Multi Tree Select Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new widget", () => {
    cy.get(explorer.addWidget).click();
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
});
