import ChartComponent from ".";
import type { ChartComponentProps } from ".";
import type { ChartData } from "../constants";
import {
  DefaultEChartConfig,
  LabelOrientation,
  DefaultFusionChartConfig,
} from "../constants";

import React from "react";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";

let container: any;

describe("Chart Widget", () => {
  const seriesData1: ChartData = {
    seriesName: "series1",
    data: [{ x: "x1", y: 1000 }],
    color: "series1color",
  };
  const seriesData2: ChartData = {
    seriesName: "series2",
    data: [{ x: "x1", y: 2000 }],
    color: "series2color",
  };
  const defaultProps: ChartComponentProps = {
    allowScroll: true,
    showDataPointLabel: true,
    chartData: {
      seriesID1: seriesData1,
      seriesID2: seriesData2,
    },
    chartName: "chart name",
    chartType: "AREA_CHART",
    customEChartConfig: DefaultEChartConfig,
    customFusionChartConfig: DefaultFusionChartConfig,
    hasOnDataPointClick: true,
    isVisible: true,
    isLoading: false,
    setAdaptiveYMin: false,
    labelOrientation: LabelOrientation.AUTO,
    onDataPointClick: (point) => {
      return point;
    },
    widgetId: "widgetID",
    xAxisName: "xaxisname",
    yAxisName: "yaxisname",
    borderRadius: "1",
    boxShadow: "1",
    primaryColor: "primarycolor",
    fontFamily: "fontfamily",
    dimensions: { componentWidth: 1000, componentHeight: 1000 },
    parentColumnSpace: 1,
    parentRowSpace: 1,
    topRow: 0,
    bottomRow: 100,
    leftColumn: 0,
    rightColumn: 100,
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("1. renders the correct library for chart type", async () => {
    const { container, getByText, rerender } = render(
      <ChartComponent {...defaultProps} />,
    );

    const xAxisLabel = getByText("xaxisname");
    expect(xAxisLabel).toBeInTheDocument();

    let echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).toBeInTheDocument();

    let fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).not.toBeInTheDocument();

    let props = { ...defaultProps };
    props.chartType = "CUSTOM_FUSION_CHART";

    rerender(<ChartComponent {...props} />);

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).not.toBeInTheDocument();

    fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();

    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);

    const matchaLatte = getByText("Matcha Latte");
    expect(matchaLatte).toBeInTheDocument();
  });

  it("2. successfully switches sequence of basic chart/custom fusion chart/basic chart/custom echart", async () => {
    // First render with Area Chart
    let props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "AREA_CHART";

    const { container, getByText, rerender } = render(
      <ChartComponent {...props} />,
    );

    let xAxisLabel = getByText("xaxisname");
    expect(xAxisLabel).toBeInTheDocument();

    let echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).toBeInTheDocument();

    let fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).not.toBeInTheDocument();

    // Second render with fusion charts
    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_FUSION_CHART";

    rerender(<ChartComponent {...props} />);

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).not.toBeInTheDocument();

    fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();

    // Third render with Area charts again.
    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "AREA_CHART";

    rerender(<ChartComponent {...props} />);

    xAxisLabel = getByText("xaxisname");
    expect(xAxisLabel).toBeInTheDocument();

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).toBeInTheDocument();

    // Render Custom EChart
    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);

    const matchaLatte = getByText("Matcha Latte");
    expect(matchaLatte).toBeInTheDocument();
  });

  it("3. adds a click event when user adds a click callback", async () => {
    const mockCallback = jest.fn((params) => params);
    const props = { ...defaultProps };
    props.onDataPointClick = (point) => {
      point;
      mockCallback(point);
    };

    render(<ChartComponent {...props} />);

    expect(mockCallback.mock.calls.length).toEqual(0);
    const el = await screen.findByText("1000");
    userEvent.click(el);
    expect(mockCallback.mock.calls.length).toEqual(1);
  });

  it("4. check each chart type has their independent error showing up in the chart widget", () => {
    let props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_ECHART";

    const { container, getByText, queryByText, rerender } = render(
      <ChartComponent {...props} />,
    );

    const matchaLatte = getByText("Matcha Latte");
    expect(matchaLatte).toBeInTheDocument();

    // incorrect source key, thus incorrect echart configuration
    props = JSON.parse(JSON.stringify(props));
    delete props.customEChartConfig.dataset.source;
    props.customEChartConfig.dataset.soce = {};

    rerender(<ChartComponent {...props} />);

    const errorTitle = getByText("Error in Chart Data/Configuration");
    expect(errorTitle).toBeInTheDocument();
    expect(queryByText("Matcha Latte")).toBeNull();

    // change chart type to basic echart
    props = JSON.parse(JSON.stringify(props));
    props.chartType = "LINE_CHART";

    rerender(<ChartComponent {...props} />);

    expect(queryByText("Error in Chart Data/Configuration")).toBeNull();
    expect(queryByText("Matcha Latte")).toBeNull();
    expect(queryByText("xaxisname")).toBeInTheDocument();

    // Check if updating props in basic charts is working
    props = JSON.parse(JSON.stringify(props));
    props.chartType = "LINE_CHART";
    props.xAxisName = "xaxisname123";

    rerender(<ChartComponent {...props} />);

    expect(queryByText("Error in Chart Data/Configuration")).toBeNull();
    expect(queryByText("Matcha Latte")).toBeNull();
    expect(queryByText("xaxisname")).not.toBeInTheDocument();
    expect(queryByText("xaxisname123")).toBeInTheDocument();

    // switching back to custom echart should show the original error
    props = JSON.parse(JSON.stringify(props));
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);
    expect(
      queryByText("Error in Chart Data/Configuration"),
    ).toBeInTheDocument();

    // Remove error from custom EChart, the chart should render without errors
    props = JSON.parse(JSON.stringify(props));
    props.customEChartConfig.dataset.source = JSON.parse(
      JSON.stringify((defaultProps.customEChartConfig.dataset as any).source),
    );
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);

    expect(
      queryByText("Error in Chart Data/Configuration"),
    ).not.toBeInTheDocument();
    expect(queryByText("Matcha Latte")).toBeInTheDocument();

    // Check if updating the props in custom ECharts is working now
    props = JSON.parse(JSON.stringify(props));
    let updatedSource = JSON.parse(
      JSON.stringify((props.customEChartConfig.dataset as any).source),
    );
    updatedSource[2][0] = "Matcha Latte 123";
    props.customEChartConfig.dataset.source = updatedSource;
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);
    expect(queryByText("Matcha Latte 123")).toBeInTheDocument();

    // Switch to custom fusion charts
    props = JSON.parse(JSON.stringify(props));
    props.chartType = "CUSTOM_FUSION_CHART";

    rerender(<ChartComponent {...props} />);

    expect(
      queryByText("Error in Chart Data/Configuration"),
    ).not.toBeInTheDocument();
    const fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();

    // Switching back to custom echart should work.
    props = JSON.parse(JSON.stringify(props));
    props.customEChartConfig.dataset.source = JSON.parse(
      JSON.stringify((defaultProps.customEChartConfig.dataset as any).source),
    );
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);

    expect(queryByText("Matcha Latte")).toBeInTheDocument();

    // Updating props in custom echart should work.
    props = JSON.parse(JSON.stringify(props));
    updatedSource = JSON.parse(
      JSON.stringify((props.customEChartConfig.dataset as any).source),
    );
    updatedSource[2][0] = "Matcha Latte 456";

    props.customEChartConfig.dataset.source = updatedSource;
    props.chartType = "CUSTOM_ECHART";

    rerender(<ChartComponent {...props} />);
    expect(queryByText("Matcha Latte 456")).toBeInTheDocument();
  });
});
