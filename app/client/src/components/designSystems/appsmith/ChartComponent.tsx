import _, { isString } from "lodash";
import React from "react";
import styled from "styled-components";

import { getBorderCSSShorthand, invisible } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "configs";
import { ChartData, ChartDataPoint, ChartType } from "widgets/ChartWidget";
import log from "loglevel";

export interface CustomFusionChartConfig {
  type: string;
  dataSource?: any;
}

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
  chartData: ChartData[];
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

  getChartData = () => {
    const chartData: ChartData[] = this.props.chartData;

    if (chartData.length === 0) {
      return [
        {
          label: "",
          value: "",
        },
      ];
    }

    let data: ChartDataPoint[] = chartData[0].data;
    if (isString(chartData[0].data)) {
      try {
        data = JSON.parse(chartData[0].data);
      } catch (e) {
        data = [];
      }
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
    if (data.length === 0) {
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

  getChartDataset = (chartData: ChartData[]) => {
    const categories: string[] = this.getChartCategoriesMutliSeries(chartData);
    return chartData.map((item: ChartData) => {
      const seriesChartData: Array<Record<
        string,
        unknown
      >> = this.getSeriesChartData(item.data, categories);
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
    if (
      this.props.chartData.length <= 1 ||
      this.props.chartType === "PIE_CHART"
    ) {
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
