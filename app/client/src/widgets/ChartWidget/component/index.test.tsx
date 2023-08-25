import ChartComponent from ".";
import type { ChartComponentProps } from ".";
import type { ChartData } from "../constants";
import { LabelOrientation } from "../constants";

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
    customFusionChartConfig: { type: "type", dataSource: undefined },
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
    bottomRow: 0,
    leftColumn: 0,
    rightColumn: 0,
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

    const props = { ...defaultProps };
    props.chartType = "CUSTOM_FUSION_CHART";

    rerender(<ChartComponent {...props} />);

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).not.toBeInTheDocument();

    fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();
  });

  it("2. successfully switches sequence of basic chart/custom fusion chart/basic chart", async () => {
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
});
