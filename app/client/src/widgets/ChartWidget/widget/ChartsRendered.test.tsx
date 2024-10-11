import { RenderModes } from "constants/WidgetConstants";
import ChartWidget, { type ChartWidgetProps } from ".";
import { LabelOrientation, type ChartData } from "../constants";

describe("ChartWidget getWidgetView", () => {
  let chartWidget: ChartWidget;

  const seriesData1: ChartData = {
    seriesName: "series1",
    data: [{ x: "x1", y: 1 }],
    color: "series1color",
  };
  const seriesData2: ChartData = {
    seriesName: "series2",
    data: [{ x: "x1", y: 2 }],
    color: "series2color",
  };
  const defaultProps: ChartWidgetProps = {
    allowScroll: true,
    showDataPointLabel: true,
    chartData: {
      seriesID1: seriesData1,
      seriesID2: seriesData2,
    },
    chartName: "chart name",
    type: "CHART_WIDGET",
    chartType: "AREA_CHART",
    customEChartConfig: {},
    customFusionChartConfig: { type: "type", dataSource: undefined },
    hasOnDataPointClick: true,
    isVisible: true,
    isLoading: false,
    setAdaptiveYMin: false,
    labelOrientation: LabelOrientation.AUTO,
    onDataPointClick: "",
    widgetId: "widgetID",
    xAxisName: "xaxisname",
    yAxisName: "yaxisname",
    borderRadius: "1",
    boxShadow: "1",
    primaryColor: "primarycolor",
    fontFamily: "fontfamily",
    dimensions: { componentWidth: 11, componentHeight: 11 },
    parentColumnSpace: 1,
    parentRowSpace: 1,
    topRow: 0,
    bottomRow: 0,
    leftColumn: 0,
    rightColumn: 0,
    widgetName: "widgetName",
    version: 1,
    renderMode: RenderModes.CANVAS,
  };

  it("renders loading state", () => {
    chartWidget = new ChartWidget({ ...defaultProps, isLoading: true });

    const view = chartWidget.getWidgetView();

    expect(view).toMatchSnapshot();
  });

  it("renders error state", () => {
    chartWidget = new ChartWidget({
      ...defaultProps,
      errors: [
        { name: "error", type: "configuration", message: "We have a error" },
      ],
    });

    const view = chartWidget.getWidgetView();

    expect(view).toMatchSnapshot();
  });

  it("renders empty chart data state", () => {
    chartWidget = new ChartWidget({ ...defaultProps, chartData: {} });
    const view = chartWidget.getWidgetView();

    expect(view).toMatchSnapshot();
  });

  it("renders chart with data", () => {
    chartWidget = new ChartWidget(defaultProps);
    const view = chartWidget.getWidgetView();

    expect(view).toMatchSnapshot();
  });
});
