import type { ChartComponentConnectedProps } from ".";
import type { ChartData } from "../constants";
import {
  DefaultEChartConfig,
  LabelOrientation,
  DefaultFusionChartConfig,
} from "../constants";

import React from "react";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CustomEChartIFrameComponent } from "./CustomEChartIFrameComponent";

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

const defaultProps: ChartComponentConnectedProps = {
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
  onDataPointClick: () => {},
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
  needsOverlay: false,
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any;

describe("CustomEChartIFrameComponent", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it("returns the iframe with sandbox attributes", () => {
    const { container } = render(
      <CustomEChartIFrameComponent {...defaultProps} />,
    );
    const iFrameElement = container.querySelector("iframe");
    expect(iFrameElement).toBeInTheDocument();
    expect(iFrameElement).toHaveAttribute("sandbox", "allow-scripts");

    const overlay = container.querySelector(
      "div[data-testid='iframe-overlay']",
    );
    expect(overlay).not.toBeInTheDocument();
  });

  it("renders the overlay if needsOverlay is set to true", () => {
    const props: ChartComponentConnectedProps = JSON.parse(
      JSON.stringify(defaultProps),
    );
    props.needsOverlay = true;

    const { container } = render(<CustomEChartIFrameComponent {...props} />);
    const iFrameElement = container.querySelector("iframe");
    expect(iFrameElement).toBeInTheDocument();

    const overlay = container.querySelector(
      "div[data-testid='iframe-overlay']",
    );
    expect(overlay).toBeInTheDocument();
  });
});
