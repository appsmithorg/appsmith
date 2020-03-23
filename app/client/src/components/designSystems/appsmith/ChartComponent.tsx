import React from "react";
import { ChartType, ChartData } from "widgets/ChartWidget";
import styled from "styled-components";
import { invisible } from "constants/DefaultTheme";
import _ from "lodash";
const FusionCharts = require("fusioncharts");
const Charts = require("fusioncharts/fusioncharts.charts");
const FusionTheme = require("fusioncharts/themes/fusioncharts.theme.fusion");
Charts(FusionCharts);
FusionTheme(FusionCharts);

export interface ChartComponentProps {
  chartType: ChartType;
  chartData: ChartData[];
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  widgetId: string;
  isVisible?: boolean;
}

const CanvasContainer = styled.div<ChartComponentProps>`
  border: none;
  border-radius: ${props => `${props.theme.radii[1]}px`};
  height: 100%;
  width: 100%;
  background: white;
  box-shadow: 0 1px 1px 0 rgba(60,75,100,.14),0 2px 1px -1px rgba(60,75,100,.12),0 1px 3px 0 rgba(60,75,100,.2);
  position: relative;
  ${props => (!props.isVisible ? invisible : "")};
}`;

class ChartComponent extends React.Component<ChartComponentProps> {
  chartInstance = new FusionCharts();
  getChartType = (chartType: ChartType) => {
    switch (chartType) {
      case "LINE_CHART":
        return "line";
      case "BAR_CHART":
        return "bar2d";
      case "PIE_CHART":
        return "pie2d";
      case "COLUMN_CHART":
        return "column2d";
      case "AREA_CHART":
        return "area2d";
      default:
        return "column2d";
    }
  };

  getChartData = (chartData: ChartData[]) => {
    return chartData.map(item => {
      return {
        label: item.x,
        value: item.y,
      };
    });
  };

  createGraph = () => {
    const chartConfig = {
      type: this.getChartType(this.props.chartType),
      renderAt: this.props.widgetId + "chart-container",
      width: "100%",
      height: "100%",
      dataFormat: "json",
      dataSource: {
        chart: {
          caption: this.props.chartName,
          xAxisName: this.props.xAxisName,
          yAxisName: this.props.yAxisName,
          theme: "fusion",
          captionAlignment: "left",
          captionHorizontalPadding: 10,
          alignCaptionWithCanvas: 0,
        },
        data: this.getChartData(this.props.chartData),
      },
    };
    this.chartInstance = new FusionCharts(chartConfig);
  };

  componentDidMount() {
    this.createGraph();
    FusionCharts.ready(() => {
      this.chartInstance.render();
    });
  }

  componentDidUpdate(prevProps: ChartComponentProps) {
    if (!_.isEqual(prevProps, this.props)) {
      if (prevProps.chartType !== this.props.chartType) {
        const chartType = this.getChartType(this.props.chartType);
        this.chartInstance.chartType(chartType);
      } else {
        this.chartInstance.setChartData({
          chart: {
            caption: this.props.chartName,
            xAxisName: this.props.xAxisName,
            yAxisName: this.props.yAxisName,
            theme: "fusion",
          },
          data: this.getChartData(this.props.chartData),
        });
      }
    }
  }

  render() {
    return (
      <CanvasContainer
        {...this.props}
        id={this.props.widgetId + "chart-container"}
      />
    );
  }
}

export default ChartComponent;
