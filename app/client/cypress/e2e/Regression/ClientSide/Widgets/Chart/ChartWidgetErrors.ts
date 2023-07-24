import {
  agHelper,
  entityExplorer,
  propPane,
  draggableWidgets,
} from "../../../../../support/Objects/ObjectsCore";

describe("Chart renders widget errors", () => {
  it("1. If there are syntax errors, the errors are displayed inside the chart widget", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.CHART);

    agHelper.AssertContains("Sales Report", "exist", ".t--widget-chartwidget");
    agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "not.exist",
      ".t--widget-chartwidget",
    );

    agHelper.EnterActionValue("Series data", "{{Button1.text}}");

    agHelper.AssertContains(
      "Error in Chart Data/Configuration",
      "exist",
      ".t--widget-chartwidget",
    );
    agHelper.AssertContains(
      "Sales Report",
      "not.exist",
      ".t--widget-chartwidget",
    );
  });
});
