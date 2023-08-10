import type { DSLWidget } from "widgets/constants";
import { migrateChartWidgetLabelOrientationStaggerOption } from "./ChartWidget";
import type { ChartWidgetProps } from "widgets/ChartWidget/widget";
import { LabelOrientation } from "widgets/ChartWidget/constants";

const inputDSL: DSLWidget = {
  widgetId: "",
  widgetName: "canvas widget",
  type: "CANVAS_WIDGET",
  renderMode: "CANVAS",
  version: 1,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  isLoading: false,
  topRow: 0,
  bottomRow: 0,
  leftColumn: 0,
  rightColumn: 0,
  children: [
    {
      widgetId: "",
      widgetName: "chart widget",
      type: "CHART_WIDGET",
      renderMode: "CANVAS",
      version: 1,
      parentColumnSpace: 1,
      parentRowSpace: 1,
      isLoading: false,
      topRow: 0,
      bottomRow: 0,
      leftColumn: 0,
      rightColumn: 0,
      labelOrientation: LabelOrientation.STAGGER,
      children: [],
    },
  ],
};

describe("Migrate Label Orientation from type stagger to auto", () => {
  it("migrates label orientation from type stagger to auto", () => {
    const outputDSL = migrateChartWidgetLabelOrientationStaggerOption(inputDSL);
    const outputChartWidgetDSL = (outputDSL.children &&
      outputDSL.children[0]) as ChartWidgetProps;
    expect(outputChartWidgetDSL.labelOrientation).toEqual("auto");
  });
});
