const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.wait(7000);
  });
  it("Add new multiselect widget", () => {
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

  it("should check that more that one empty value is not allowed in options", () => {
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
  it("should check that Objects can be added to multiselect Widget default value", () => {
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
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      `[
        {
          "label": "Green",
          "value": "GREEN"
        }
      ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.wait(100);
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Green");
  });
  it("should display the right label", () => {
    cy.openPropertyPane("multiselectwidgetv2");
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
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      `[
      "GREEN",
      "RED"
    ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.wait(100);
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-selection-item-content")
      .first()
      .should("have.text", "Green");
  });
});
