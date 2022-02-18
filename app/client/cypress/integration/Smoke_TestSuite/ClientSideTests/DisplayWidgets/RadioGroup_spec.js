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

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "radiogroupwidget";
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label.radiogroup-label`;
      const containerSelector = `${widgetSelector} [data-testid="radiogroup-container"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus()
        .type(labelText);
      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "row");

      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click();
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");

      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click();
      // Assert label position: Left
      cy.get(containerSelector).should("have.css", "flex-direction", "row");
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click();
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });
});
