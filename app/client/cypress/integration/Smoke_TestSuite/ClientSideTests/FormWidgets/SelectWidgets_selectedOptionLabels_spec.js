const dsl = require("../../../../fixtures/selectWidgets_selectedOptionLabelsDsl.json");

describe("Select Widgets selectedOptionLabels", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("SelectWidget", function() {
    const widgetName = "selectwidget";
    const optionsSelector = `.t--property-control-options`;
    const defaultValueSelector = `.t--property-control-defaultvalue`;

    // 1. Checks labels and values for the first time
    cy.get(`.t--widget-textwidget`)
      .eq(0)
      .should("contain.text", "Green");
    cy.get(`.t--widget-textwidget`)
      .eq(1)
      .should("contain.text", "GREEN");
    // 2. Changes defaultOptionValue
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(defaultValueSelector, `BLUE`);
    cy.get(`.t--widget-textwidget`)
      .eq(0)
      .should("contain.text", "Blue");
    cy.get(`.t--widget-textwidget`)
      .eq(1)
      .should("contain.text", "BLUE");
    // 3. Changes options
    cy.updateCodeInput(
      optionsSelector,
      `[
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
    cy.get(`.t--widget-textwidget`)
      .eq(0)
      .should("not.contain.text", "Blue");
    cy.get(`.t--widget-textwidget`)
      .eq(1)
      .should("not.contain.text", "BLUE");
  });

  it("MultiSelectWidgetV2", function() {
    const widgetName = "multiselectwidgetv2";
    const optionsSelector = `.t--property-control-options`;
    const defaultValueSelector = `.t--property-control-defaultvalue`;
    // 1. Checks labels and values for the first time
    cy.get(`.t--widget-textwidget`)
      .eq(2)
      .should("contain.text", "Green")
      .and("contain.text", "Red");
    cy.get(`.t--widget-textwidget`)
      .eq(3)
      .should("contain.text", "GREEN")
      .and("contain.text", "RED");
    // 2. Changes defaultOptionValue
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(
      defaultValueSelector,
      `[
        "BLUE",
        "RED"
      ]`,
    );
    cy.get(`.t--widget-textwidget`)
      .eq(2)
      .should("contain.text", "Blue")
      .and("contain.text", "Red");
    cy.get(`.t--widget-textwidget`)
      .eq(3)
      .should("contain.text", "BLUE")
      .and("contain.text", "RED");
    // 3. Changes options
    cy.updateCodeInput(
      optionsSelector,
      `[
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
    cy.get(`.t--widget-textwidget`)
      .eq(2)
      .should("not.contain.text", "Blue")
      .and("contain.text", "Red");
    cy.get(`.t--widget-textwidget`)
      .eq(3)
      .should("not.contain.text", "BLUE")
      .and("contain.text", "RED");
  });

  it("SingleSelectTreeWidget", function() {
    const widgetName = "singleselecttreewidget";
    const optionsSelector = `.t--property-control-options`;
    const defaultValueSelector = `.t--property-control-defaultvalue`;

    // 1. Checks labels and values for the first time
    cy.get(`.t--widget-textwidget`)
      .eq(4)
      .should("contain.text", "Blue");
    cy.get(`.t--widget-textwidget`)
      .eq(5)
      .should("contain.text", "BLUE");
    // 2. Changes defaultOptionValue
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(defaultValueSelector, `GREEN`);
    cy.get(`.t--widget-textwidget`)
      .eq(4)
      .should("contain.text", "Green");
    cy.get(`.t--widget-textwidget`)
      .eq(5)
      .should("contain.text", "GREEN");
    // 3. Changes options
    cy.updateCodeInput(
      optionsSelector,
      `[
        {
          "label": "Blue",
          "value": "BLUE",
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
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    cy.get(`.t--widget-textwidget`)
      .eq(4)
      .should("not.contain.text", "Green");
    cy.get(`.t--widget-textwidget`)
      .eq(5)
      .should("not.contain.text", "GREEN");
  });

  it("MultiSelectTreeWidget", function() {
    const widgetName = "multiselecttreewidget";
    const optionsSelector = `.t--property-control-options`;
    const defaultValueSelector = `.t--property-control-defaultvalue`;
    // 1. Checks labels and values for the first time
    cy.get(`.t--widget-textwidget`)
      .eq(6)
      .should("contain.text", "Green");
    cy.get(`.t--widget-textwidget`)
      .eq(7)
      .should("contain.text", "GREEN");
    // 2. Changes defaultOptionValue
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(
      defaultValueSelector,
      `[
        "BLUE",
        "RED"
      ]`,
    );
    cy.get(`.t--widget-textwidget`)
      .eq(6)
      .should("contain.text", "Blue")
      .and("contain.text", "Dark Blue")
      .and("contain.text", "Light Blue")
      .and("contain.text", "Red");
    cy.get(`.t--widget-textwidget`)
      .eq(7)
      .should("contain.text", "BLUE")
      .and("contain.text", "DARK BLUE")
      .and("contain.text", "LIGHT BLUE")
      .and("contain.text", "RED");
    // 3. Changes options
    cy.updateCodeInput(
      optionsSelector,
      `[
        {
          "label": "Blue",
          "value": "BLUE",
          "children": [
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
    cy.get(`.t--widget-textwidget`)
      .eq(6)
      .should("contain.text", "Light Blue")
      .and("contain.text", "Red");
    cy.get(`.t--widget-textwidget`)
      .eq(7)
      .should("contain.text", "LIGHT BLUE")
      .and("contain.text", "RED");
  });
});
