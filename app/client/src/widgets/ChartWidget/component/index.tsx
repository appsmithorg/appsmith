import _, { get } from "lodash";
import React from "react";
import styled from "styled-components";

import { getBorderCSSShorthand, invisible } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "configs";
import {
  ChartDataPoint,
  ChartType,
  CustomFusionChartConfig,
  AllChartData,
} from "../constants";
import log from "loglevel";

const FusionCharts = require("fusioncharts");
const plugins: Record<string, any> = {
  Charts: require("fusioncharts/fusioncharts.charts"),
  FusionTheme: require("fusioncharts/themes/fusioncharts.theme.fusion"),
  Widgets: require("fusioncharts/fusioncharts.widgets"),
  ZoomScatter: require("fusioncharts/fusioncharts.zoomscatter"),
  ZoomLine: require("fusioncharts/fusioncharts.zoomline"),
  PowerCharts: require("fusioncharts/fusioncharts.powercharts"),
  TimeSeries: require("fusioncharts/fusioncharts.timeseries"),
  OverlappedColumn: require("fusioncharts/fusioncharts.overlappedcolumn2d"),
  OverlappedBar: require("fusioncharts/fusioncharts.overlappedbar2d"),
  TreeMap: require("fusioncharts/fusioncharts.treemap"),
  Maps: require("fusioncharts/fusioncharts.maps"),
  Gantt: require("fusioncharts/fusioncharts.gantt"),
  VML: require("fusioncharts/fusioncharts.vml"),
};

// Enable all plugins.
// This is needed to support custom chart configs
Object.keys(plugins).forEach((key: string) =>
  (plugins[key] as any)(FusionCharts),
);

const { fusioncharts } = getAppsmithConfigs();
FusionCharts.options.license({
  key: fusioncharts.licenseKey,
  creditLabel: false,
});

export interface ChartComponentProps {
  chartType: ChartType;
  chartData: AllChartData;
  customFusionChartConfig: CustomFusionChartConfig;
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  widgetId: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
  onDataPointClick: (selectedDataPoint: { x: any; y: any }) => void;
}

const CanvasContainer = styled.div<
  Omit<ChartComponentProps, "onDataPointClick">
>`
  border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
  border-radius: 0;
  height: 100%;
  width: 100%;
  background: white;
  overflow: hidden;
  position: relative;
  ${(props) => (!props.isVisible ? invisible : "")};
  padding: 10px 0 0 0;
}`;

class ChartComponent extends React.Component<ChartComponentProps> {
  chartInstance = new FusionCharts();

  getChartType = () => {
    const { allowHorizontalScroll, chartData, chartType } = this.props;
    const dataLength = Object.keys(chartData).length;
    const isMSChart = dataLength > 1;
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

  getChartData = () => {
    const chartData: AllChartData = this.props.chartData;
    const dataLength = Object.keys(chartData).length;

    // if datalength is zero, just pass a empty datum
    if (dataLength === 0) {
      return [
        {
          label: "",
          value: "",
        },
      ];
    }

    const firstKey = Object.keys(chartData)[0] as string;
    let data = get(chartData, `${firstKey}.data`, []) as ChartDataPoint[];

    if (!Array.isArray(data)) {
      data = [];
    }

    if (data.length === 0) {
      return [
        {
          label: "",
          value: "",
        },
      ];
    }

    return data.map((item) => {
      return {
        label: item.x,
        value: item.y,
      };
    });
  };

  getChartCategoriesMutliSeries = (chartData: AllChartData) => {
    const categories: string[] = [];

    Object.keys(chartData).forEach((key: string) => {
      let data = get(chartData, `${key}.data`, []) as ChartDataPoint[];

      if (!Array.isArray(data)) {
        data = [];
      }

      for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
        const category = data[dataIndex].x;
        if (!categories.includes(category)) {
          categories.push(category);
        }
      }
    });

    return categories;
  };

  getChartCategories = (chartData: AllChartData) => {
    const categories: string[] = this.getChartCategoriesMutliSeries(chartData);

    if (categories.length === 0) {
      return [
        {
          label: "",
        },
      ];
    }
    return categories.map((item) => {
      return {
        label: item,
      };
    });
  };

  getSeriesChartData = (data: ChartDataPoint[], categories: string[]) => {
    const dataMap: { [key: string]: string } = {};

    // if not array or (is array and array length is zero)
    if (!Array.isArray(data) || (Array.isArray(data) && data.length === 0)) {
      return [
        {
          value: "",
        },
      ];
    }
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

  /**
   * creates dataset need by fusion chart  from widget object-data
   *
   * @param chartData
   * @returns
   */
  getChartDataset = (chartData: AllChartData) => {
    const categories: string[] = this.getChartCategoriesMutliSeries(chartData);

    const dataset = Object.keys(chartData).map((key: string) => {
      const item = get(chartData, `${key}`);

      const seriesChartData: Array<Record<
        string,
        unknown
      >> = this.getSeriesChartData(get(item, "data", []), categories);
      return {
        seriesName: item.seriesName,
        data: seriesChartData,
      };
    });

    return dataset;
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
    const dataLength = Object.keys(this.props.chartData).length;

    if (dataLength <= 1 || this.props.chartType === "PIE_CHART") {
      return {
        chart: this.getChartConfig(),
        data: this.getChartData(),
      };
    } else {
      return {
        chart: this.getChartConfig(),
        categories: [
          {
            category: this.getChartCategories(this.props.chartData),
          },
        ],
        dataset: this.getChartDataset(this.props.chartData),
      };
    }
  };

  getCustomFusionChartDataSource = () => {
    let config = this.props.customFusionChartConfig as CustomFusionChartConfig;
    if (config && config.dataSource) {
      config = {
        ...config,
        dataSource: {
          ...config.dataSource,
          chart: {
            ...config.dataSource.chart,
            caption: this.props.chartName || config.dataSource.chart.caption,
          },
        },
      };
    }
    return config;
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
          category: this.getChartCategories(this.props.chartData),
        },
      ],
      data: this.getChartData(),
      dataset: this.getChartDataset(this.props.chartData),
    };
  };

  createGraph = () => {
    if (this.props.chartType === "CUSTOM_FUSION_CHART") {
      const chartConfig = {
        renderAt: this.props.widgetId + "chart-container",
        width: "100%",
        height: "100%",
        events: {
          dataPlotClick: (evt: any) => {
            const data = evt.data;
            this.props.onDataPointClick({
              x: data.categoryLabel,
              y: data.dataValue,
            });
          },
        },
        ...this.getCustomFusionChartDataSource(),
      };
      this.chartInstance = new FusionCharts(chartConfig);
      return;
    }
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
      events: {
        dataPlotClick: (evt: any) => {
          const data = evt.data;
          this.props.onDataPointClick({
            x: data.categoryLabel,
            y: data.dataValue,
          });
        },
      },
    };

    this.chartInstance = new FusionCharts(chartConfig);
  };

  componentDidMount() {
    this.createGraph();
    FusionCharts.ready(() => {
      /* Component could be unmounted before FusionCharts is ready,
      this check ensure we don't render on unmounted component */
      if (this.chartInstance) {
        try {
          this.chartInstance.render();
        } catch (e) {
          log.error(e);
        }
      }
    });
  }

  componentWillUnmount() {
    if (this.chartInstance) {
      this.chartInstance = null;
    }
  }

  componentDidUpdate(prevProps: ChartComponentProps) {
    if (!_.isEqual(prevProps, this.props)) {
      if (this.props.chartType === "CUSTOM_FUSION_CHART") {
        const chartConfig = {
          renderAt: this.props.widgetId + "chart-container",
          width: "100%",
          height: "100%",
          events: {
            dataPlotClick: (evt: any) => {
              const data = evt.data;
              this.props.onDataPointClick({
                x: data.categoryLabel,
                y: data.dataValue,
              });
            },
          },
          ...this.getCustomFusionChartDataSource(),
        };
        this.chartInstance = new FusionCharts(chartConfig);
        this.chartInstance.render();
        return;
      }
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
    //eslint-disable-next-line  @typescript-eslint/no-unused-vars
    const { onDataPointClick, ...rest } = this.props;
    return (
      <CanvasContainer {...rest} id={this.props.widgetId + "chart-container"} />
    );
  }
}

export default ChartComponent;
