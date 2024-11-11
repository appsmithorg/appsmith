import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Chart Widget Functionality around custom chart data",
  { tags: ["@tag.Widget", "@tag.Chart", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("chartCustomDataDsl");
    });

    it("1. change chart type to custom chart", function () {
      const value1 = 40;
      cy.openPropertyPane("chartwidget");
      cy.UpdateChartType("Custom Fusion Charts (deprecated)");
      //change chart value via input widget and validate
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
        cy.get(`.t--widget-${widgetName} input`).click().type(text);
      }
      cy.get(`.t--widget-${widgetName} input`).should("have.value", expected);
    }
  },
);
