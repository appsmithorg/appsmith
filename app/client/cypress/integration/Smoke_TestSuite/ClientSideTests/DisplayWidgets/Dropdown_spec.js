const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");
const formWidget = require("../../../../locators/FormWidgets.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("dropdownwidget", { x: 300, y: 300 });
    cy.get(".t--widget-dropdownwidget").should("exist");
  });

  it("should check that empty value is allowed in options", () => {
    cy.openPropertyPane("dropdownwidget");
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
    cy.openPropertyPane("dropdownwidget");
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
  it("should check that no option should be focued when default option is empty", () => {
    cy.openPropertyPane("dropdownwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": "BLUE"
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
    cy.wait(500);
    cy.updateCodeInput(".t--property-control-defaultoption", "");
    cy.wait(500);

    cy.get(formWidget.dropdownWidgetInput).click({ force: true });
    cy.wait(1000);
    cy.get(".single-select").should("not.have.class", "is-focused");
  });
});
