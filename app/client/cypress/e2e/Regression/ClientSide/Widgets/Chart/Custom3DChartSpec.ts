import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
const publicWidgetsPage = require("../../../../../locators/publishWidgetspage.json");

describe("3D Custom EChart feature", function () {
  it("5. 3D EChart Custom Chart Widget Functionality", function () {
    featureFlagIntercept({
      release_custom_echarts_enabled: true,
    });
    _.agHelper.RefreshPage();
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.CHART);
    _.propPane.SelectPropertiesDropDown("Chart type", "Custom EChart");
    _.propPane.UpdatePropertyFieldValue(
      "Custom ECharts Configuration",
      `{{${JSON.stringify(this.dataSet.Custom3DEChartConfig)}}}`,
    );
    _.deployMode.DeployApp();
    cy.get(publicWidgetsPage.chartWidget).matchImageSnapshot("3DCustomECharts");
  });
});
