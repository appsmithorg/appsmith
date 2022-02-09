const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselectwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-multiselectwidgetv2").should("exist");
  });

  it("should check that empty value is allowed in options", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.updateCodeInput(
      ".t--property-control-options",
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
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
  });

  it("should check that more thatn empty value is not allowed in options", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": ""
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
