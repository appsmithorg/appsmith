import type { DSLWidget } from "widgets/constants";
import {
  migrateChartWidgetLabelOrientationStaggerOption,
  migrateAddShowHideDataPointLabels,
} from "./ChartWidget";
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
      allowScroll: true,
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

describe("Migrate Label show/hide property with respect to chart's allow scroll property", () => {
  it("if allow scroll property is false, it migrates label show/hide property to false", () => {
    const allowScroll = false;

    const dsl = JSON.parse(JSON.stringify(inputDSL));
    const chartDSL = (dsl.children ?? [])[0];
    chartDSL.allowScroll = allowScroll;

    expect(dsl.showDataPointLabel).toBeUndefined();

    const outputDSL = migrateAddShowHideDataPointLabels(dsl);
    const outputChartWidgetDSL = (outputDSL.children &&
      outputDSL.children[0]) as ChartWidgetProps;

    expect(outputChartWidgetDSL.showDataPointLabel).not.toBeUndefined();
    expect(outputChartWidgetDSL.showDataPointLabel).toEqual(false);
  });

  it("if allow scroll property is true, it migrates label show/hide property to true", () => {
    const allowScroll = true;

    const dsl = JSON.parse(JSON.stringify(inputDSL));
    const chartDSL = (dsl.children ?? [])[0];
    chartDSL.allowScroll = allowScroll;

    expect(dsl.showDataPointLabel).toBeUndefined();

    const outputDSL = migrateAddShowHideDataPointLabels(dsl);
    const outputChartWidgetDSL = (outputDSL.children &&
      outputDSL.children[0]) as ChartWidgetProps;

    expect(outputChartWidgetDSL.showDataPointLabel).not.toBeUndefined();
    expect(outputChartWidgetDSL.showDataPointLabel).not.toBeNull();
    expect(outputChartWidgetDSL.showDataPointLabel).toEqual(true);
  });
});
