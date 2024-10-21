import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Chart renders widget errors",
  { tags: ["@tag.Widget", "@tag.Chart", "@tag.Binding"] },
  () => {
    it("1. If there are syntax errors, the errors are displayed inside the chart widget", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART);

      agHelper.AssertContains(
        "Sales Report",
        "exist",
        locators._widgetInDeployed(draggableWidgets.CHART),
      );
      agHelper.AssertContains(
        "Error in Chart Data/Configuration",
        "not.exist",
        locators._widgetInDeployed(draggableWidgets.CHART),
      );

      agHelper.EnterActionValue("Series data", "{{Button1.text}}");

      agHelper.AssertContains(
        "Error in Chart Data/Configuration",
        "exist",
        locators._widgetInDeployed(draggableWidgets.CHART),
      );
      agHelper.AssertContains(
        "Sales Report",
        "not.exist",
        locators._widgetInDeployed(draggableWidgets.CHART),
      );
    });

    it("2. shows no chart data available is series data is missing", function () {
      agHelper.EnterActionValue("Series data", "");

      agHelper.AssertContains(
        "No chart data to display",
        "exist",
        locators._widgetInDeployed(draggableWidgets.CHART),
      );
    });
  },
);
