const dsl = require("../../../../../fixtures/chartCustomDataDsl.json");

describe("Chart Widget Functionality around custom chart data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. change chart type to custom chart", function() {
    cy.openPropertyPane("chartwidget");
    cy.UpdateChartType("Custom Chart");
  });

  it("2. change chart value via input widget and validate", function() {
    const value1 = 40;
    enterAndTest("inputwidgetv2", value1, value1);
    cy.wait(400);
    cy.get(".t--draggable-chartwidget")
      .get("[class^=raphael-group-][class$=-tracker]")
      .trigger("mouseover");
    cy.wait(400);
    cy.get(".t--draggable-chartwidget .fc__tooltip.fusioncharts-div").should(
      "have.text",
      `${value1} %`,
    );
  });

  function enterAndTest(widgetName, text, expected) {
    cy.get(`.t--widget-${widgetName} input`).clear();
    cy.wait(300);
    if (text) {
      cy.get(`.t--widget-${widgetName} input`)
        .click()
        .type(text);
    }
    cy.get(`.t--widget-${widgetName} input`).should("have.value", expected);
  }
});
