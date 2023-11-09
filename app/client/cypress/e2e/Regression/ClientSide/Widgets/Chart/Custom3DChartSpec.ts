import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
const publicWidgetsPage = require("../../../../../locators/publishWidgetspage.json");

describe("3D Custom EChart feature", function () {
  it("1. 3D EChart Custom Chart Widget Functionality", function () {
    featureFlagIntercept({
      release_custom_echarts_enabled: true,
    });
    _.agHelper.RefreshPage();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.CHART);

    _.propPane.SelectPropertiesDropDown("Chart type", "Custom EChart");

    cy.wait(1000);
    cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot("2DCustomECharts");

    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.Custom3DEChartConfig)}}}`,
    );

    cy.wait(1000);
    cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot("3DCustomECharts");

    _.entityExplorer.SelectEntityByName("Chart1", "Widgets");
    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.InvalidCustom3DEChartConfig)}}}`,
    );

    _.agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "exist",
      _.locators._widgetInDeployed(_.draggableWidgets.CHART),
    );

    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.Custom3DEChartConfig)}}}`,
    );

    _.agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "not.exist",
      _.locators._widgetInDeployed(_.draggableWidgets.CHART),
    );

    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.InvalidCustom3DEChartConfig)}}}`,
    );

    _.agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "exist",
      _.locators._widgetInDeployed(_.draggableWidgets.CHART),
    );

    _.propPane.SelectPropertiesDropDown("Chart type", "Custom Fusion Charts");

    cy.wait(1000);
    cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot("FusionCharts");

    _.propPane.SelectPropertiesDropDown("Chart type", "Custom EChart");

    _.agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "exist",
      _.locators._widgetInDeployed(_.draggableWidgets.CHART),
    );

    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.Custom3DEChartConfig)}}}`,
    );

    _.agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "not.exist",
      _.locators._widgetInDeployed(_.draggableWidgets.CHART),
    );

    cy.wait(1000);
    cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot(
      "3DCustomECharts-2",
    );
  });
});
