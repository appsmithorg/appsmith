import React from "react";
import { ChartType, ChartData, ChartDataPoint } from "widgets/ChartWidget";
import styled from "styled-components";
import { invisible } from "constants/DefaultTheme";
import _ from "lodash";
const FusionCharts = require("fusioncharts");
const Charts = require("fusioncharts/fusioncharts.charts");
const FusionTheme = require("fusioncharts/themes/fusioncharts.theme.fusion");
Charts(FusionCharts);
FusionTheme(FusionCharts);
FusionCharts.options.creditLabel = false;

export interface ChartComponentProps {
  chartType: ChartType;
  chartData: ChartData[] | ChartDataPoint[];
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  widgetId: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
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
  padding: 10px 0 0 0;
}`;

class ChartComponent extends React.Component<ChartComponentProps> {
  chartInstance = new FusionCharts();
  getChartType = () => {
    const { chartType, allowHorizontalScroll, chartData } = this.props;
    const isMSChart = chartData.length > 1;
    switch (chartType) {
      case "PIE_CHART":
        return "pie2d";
      case "LINE_CHART":
        return allowHorizontalScroll
          ? "scrollline2d"
          : isMSChart
          ? "msline"
          : "line";
      case "BAR_CHART":
        return allowHorizontalScroll
          ? "scrollBar2D"
          : isMSChart
          ? "msbar2d"
          : "bar2d";
      case "COLUMN_CHART":
        return allowHorizontalScroll
          ? "scrollColumn2D"
          : isMSChart
          ? "mscolumn2d"
          : "column2d";
      case "AREA_CHART":
        return allowHorizontalScroll
          ? "scrollarea2d"
          : isMSChart
          ? "msarea"
          : "area2d";
      default:
        return allowHorizontalScroll ? "scrollColumn2D" : "mscolumn2d";
    }
  };

  getChartData = (chartData: ChartData[]) => {
    const data: ChartDataPoint[] = chartData[0].data;
    return data.map(item => {
      return {
        label: item.x,
        value: item.y,
      };
    });
  };

  getChartCategoriesMutliSeries = (chartData: ChartData[]) => {
    const categories: string[] = [];
    for (let index = 0; index < chartData.length; index++) {
      const data: ChartDataPoint[] = chartData[index].data;
      for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
        const category = data[dataIndex].x;
        if (!categories.includes(category)) {
          categories.push(category);
        }
      }
    }
    return categories;
  };

  getChartCategories = (chartData: ChartData[]) => {
    const categories: string[] = this.getChartCategoriesMutliSeries(chartData);
    return categories.map(item => {
      return {
        label: item,
      };
    });
  };

  getSeriesChartData = (data: ChartDataPoint[], categories: string[]) => {
    const dataMap: { [key: string]: string } = {};
    for (let index = 0; index < data.length; index++) {
      const item: ChartDataPoint = data[index];
      dataMap[item.x] = item.y;
    }
    return categories.map((category: string) => {
      return {
        value: dataMap[category] ? dataMap[category] : null,
      };
    });
  };

  getChartDataset = (chartData: ChartData[]) => {
    const categories: string[] = this.getChartCategoriesMutliSeries(chartData);
    return chartData.map((item: ChartData) => {
      const seriesChartData: object[] = this.getSeriesChartData(
        item.data,
        categories,
      );
      return {
        seriesName: item.seriesName,
        data: seriesChartData,
      };
    });
  };

  getChartConfig = () => {
    return {
      caption: this.props.chartName,
      xAxisName: this.props.xAxisName,
      yAxisName: this.props.yAxisName,
      theme: "fusion",
      captionAlignment: "left",
      captionHorizontalPadding: 10,
      alignCaptionWithCanvas: 0,
    };
  };

  getChartDataSource = () => {
    let chartData: ChartData[];
    if (!Array.isArray(this.props.chartData[0])) {
      chartData = [{ data: this.props.chartData as ChartDataPoint[] }];
    } else {
      chartData = this.props.chartData as ChartData[];
    }
    if (
      this.props.chartData.length === 1 ||
      this.props.chartType === "PIE_CHART"
    ) {
      return {
        chart: this.getChartConfig(),
        data: this.getChartData(chartData),
      };
    } else {
      return {
        chart: this.getChartConfig(),
        categories: [
          {
            category: this.getChartCategories(chartData),
          },
        ],
        dataset: this.getChartDataset(chartData),
      };
    }
  };

  getScrollChartDataSource = () => {
    const chartConfig = this.getChartConfig();
    return {
      chart: {
        ...chartConfig,
        scrollheight: "10",
        showvalues: "1",
        numVisiblePlot: "5",
        flatScrollBars: "1",
      },
      categories: [
        {
          category: this.getChartCategories(
            this.props.chartData as ChartData[],
          ),
        },
      ],
      dataset: this.getChartDataset(this.props.chartData as ChartData[]),
    };
  };

  createGraph = () => {
    const dataSource =
      this.props.allowHorizontalScroll && this.props.chartType !== "PIE_CHART"
        ? this.getScrollChartDataSource()
        : this.getChartDataSource();
    const chartConfig = {
      type: this.getChartType(),
      renderAt: this.props.widgetId + "chart-container",
      width: "100%",
      height: "100%",
      dataFormat: "json",
      dataSource: dataSource,
    };
    console.log("chartConfig", chartConfig);
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
      const chartType = this.getChartType();
      this.chartInstance.chartType(chartType);
      if (
        this.props.allowHorizontalScroll &&
        this.props.chartType !== "PIE_CHART"
      ) {
        this.chartInstance.setChartData(this.getScrollChartDataSource());
      } else {
        this.chartInstance.setChartData(this.getChartDataSource());
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
