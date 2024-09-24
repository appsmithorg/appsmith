/* eslint-disable @typescript-eslint/no-explicit-any */
import { migrateDefaultValuesForCustomEChart } from "../migrations/085-migrate-default-values-for-custom-echart";
import { migrateAddShowHideDataPointLabels } from "../migrations/083-migrate-add-show-hide-data-point-labels";
import { migrateChartWidgetLabelOrientationStaggerOption } from "../migrations/082-migrate-chart-widget-label-orientation-stagger-option";
import type { DSLWidget } from "../types";
import { migrateChartwidgetCustomEchartConfig } from "../migrations/087-migrate-chart-widget-customechartdata";

type ChartWidgetProps = any;

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
      labelOrientation: "stagger",
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

describe("Migrate Default Custom EChart configuration", () => {
  it("adds echart custom chart default configuration to existing charts", () => {
    const inputChartWidgetDSL = inputDSL.children?.[0] as ChartWidgetProps;

    expect(inputChartWidgetDSL.customEChartConfig).not.toBeDefined();

    const outputDSL = migrateDefaultValuesForCustomEChart(inputDSL);
    const outputChartWidgetDSL = outputDSL.children?.[0] as ChartWidgetProps;

    expect(outputChartWidgetDSL.customEChartConfig).toBeDefined();
    expect(
      Object.keys(outputChartWidgetDSL.customEChartConfig).length,
    ).toBeGreaterThan(0);
  });
});

describe("Migrate customEcChartConfig", () => {
  it("test that customEChartConfig is migrated for matching cases", () => {
    const chartWidgetDSL = inputDSL.children?.[0] as ChartWidgetProps;

    const widgetName = chartWidgetDSL.widgetName;

    chartWidgetDSL.customEChartConfig = `{{ ((chartType) => ( \n${widgetName}.chartData\n))(${widgetName}.chartType); }}`;

    migrateChartwidgetCustomEchartConfig(inputDSL);

    expect(chartWidgetDSL.customEChartConfig).toEqual(
      `{{ ((chartType) => ( \n${widgetName}.chartData\n))(${widgetName}.chartType) }}`,
    );

    chartWidgetDSL.customEChartConfig = `{{ ((chartType) => ( \n${widgetName}.chartData\n))(${widgetName}.chartType); }} something`;

    migrateChartwidgetCustomEchartConfig(inputDSL);

    expect(chartWidgetDSL.customEChartConfig).toEqual(
      `{{ ((chartType) => ( \n${widgetName}.chartData\n))(${widgetName}.chartType); }} something`,
    );
  });
});
