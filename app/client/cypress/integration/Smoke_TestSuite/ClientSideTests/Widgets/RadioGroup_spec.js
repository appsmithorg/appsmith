const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Radiogroup Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("radiogroupwidget", { x: 300, y: 300 });
    cy.get(".t--widget-radiogroupwidget").should("exist");
  });

  it("should check that empty value is allowed in options", () => {
    cy.openPropertyPane("radiogroupwidget");
    cy.get(".t--property-control-options")
      .find(".t--js-toggle")
      .click({ force: true });
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
          {
            "label": "Yes",
            "value": "Y"
          },
          {
            "label": "No",
            "value": ""
          }
        ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
  });

  it("should check that more thatn empty value is not allowed in options", () => {
    cy.openPropertyPane("radiogroupwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
          {
            "label": "Yes",
            "value": ""
          },
          {
            "label": "No",
            "value": ""
          }
        ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "exist",
    );
  });
});
