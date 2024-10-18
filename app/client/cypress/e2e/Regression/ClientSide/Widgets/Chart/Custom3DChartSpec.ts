import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
const publicWidgetsPage = require("../../../../../locators/publishWidgetspage.json");

describe.skip(
  "3D Custom EChart feature",
  { tags: ["@tag.Widget", "@tag.Chart", "@tag.Visual", "@tag.Binding"] },
  function () {
    it("1. 3D EChart Custom Chart Widget Functionality", function () {
      _.agHelper.RefreshPage();
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.CHART);

      _.propPane.SelectPropertiesDropDown("Chart type", "Custom EChart");

      cy.wait(1000);
      cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot(
        "2DCustomECharts",
      );

      _.propPane.UpdatePropertyFieldValue(
        "Custom ECharts Configuration",
        `{{${JSON.stringify(this.dataSet.Custom3DEChartConfig)}}}`,
      );

      cy.wait(1000);
      cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot(
        "3DCustomECharts",
      );

      EditorNavigation.SelectEntityByName("Chart1", EntityType.Widget);
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

      _.propPane.SelectPropertiesDropDown(
        "Chart type",
        "Custom Fusion Charts (deprecated)",
      );

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
  },
);
