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

import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import { APP_MODE } from "entities/App";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const mockStore = configureMockStore();
  const store = mockStore({
    entities: {
      canvasWidgets: {},
      app: {
        mode: APP_MODE.PUBLISHED,
      },
    },
    ui: {
      widgetDragResize: {
        selectedWidgets: [],
      },
      editor: {
        isPreviewMode: false,
      },
      applications: {
        currentApplication: "",
      },
      gitSync: {
        protectedBranches: [],
      },
    },
  });

  it("1. renders the correct library for chart type", async () => {
    const { container, getByText, rerender } = render(
      <Provider store={store}>
        <ChartComponent {...defaultProps} />
      </Provider>,
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

    rerender(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).not.toBeInTheDocument();

    fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();

    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_ECHART";

    rerender(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    echartsContainer = container.querySelector("iframe");
    expect(echartsContainer).toBeInTheDocument();
  });

  it("2. successfully switches sequence of basic chart/custom fusion chart/basic chart/custom echart", async () => {
    // First render with Area Chart
    let props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "AREA_CHART";

    const { container, getByText, rerender } = render(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
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

    rerender(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).not.toBeInTheDocument();

    fusionContainer = container.querySelector(
      "#widgetIDcustom-fusion-chart-container",
    );
    expect(fusionContainer).toBeInTheDocument();

    // Third render with Area charts again.
    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "AREA_CHART";

    rerender(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    xAxisLabel = getByText("xaxisname");
    expect(xAxisLabel).toBeInTheDocument();

    echartsContainer = container.querySelector("#widgetIDechart-container");
    expect(echartsContainer).toBeInTheDocument();

    // Render Custom EChart
    props = JSON.parse(JSON.stringify(defaultProps));
    props.chartType = "CUSTOM_ECHART";

    rerender(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    echartsContainer = container.querySelector("iframe");
    expect(echartsContainer).toBeInTheDocument();
  });

  it("3. adds a click event when user adds a click callback", async () => {
    const mockCallback = jest.fn((params) => params);
    const props = { ...defaultProps };
    props.onDataPointClick = (point) => {
      point;
      mockCallback(point);
    };

    render(
      <Provider store={store}>
        <ChartComponent {...props} />
      </Provider>,
    );

    expect(mockCallback.mock.calls.length).toEqual(0);
    const el = await screen.findByText("1000");
    await userEvent.click(el);
    expect(mockCallback.mock.calls.length).toEqual(1);
  });
});
