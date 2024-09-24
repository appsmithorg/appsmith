import type { ChartComponentProps } from ".";
import type { AllChartData, LongestLabelParams } from "../constants";
import {
  LabelOrientation,
  type ChartData,
  XAxisCategory,
  messages,
} from "../constants";

import { Colors } from "constants/Colors";
import { EChartsLayoutBuilder } from "./LayoutBuilders/EChartsLayoutBuilder";

export class EChartsConfigurationBuilder {
  fontFamily: string = "Nunito Sans";
  fontSize = 14;

  #seriesConfigurationForPieChart(
    seriesID: string,
    seriesData: ChartData,
    showDataPointLabel: boolean,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) {
    let seriesName = messages.Undefined;

    if (seriesData.seriesName && seriesData.seriesName.length > 0) {
      seriesName = seriesData.seriesName;
    }

    const config = {
      type: "pie",
      top: layoutConfig.grid.top,
      bottom: layoutConfig.grid.bottom,
      name: seriesName,
      label: {
        show: showDataPointLabel,
        fontFamily: this.fontFamily,
        color: Colors.DOVE_GRAY2,
        formatter: `{b} : {d}%`,
      },
      encode: {
        itemName: XAxisCategory,
        tooltip: seriesID,
        value: seriesID,
      },
    };

    return config;
  }

  #seriesConfigForChart(
    props: ChartComponentProps,
    allSeriesData: AllChartData,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) {
    /**
     * {
     *  series: [ { type: "pie", radius: "40%", center: ["50%", 50%]}]
     * }
     */
    const configs: unknown[] = [];

    Object.keys(allSeriesData).forEach((seriesID, index) => {
      const seriesData = allSeriesData[seriesID];
      let color = seriesData.color;

      if (index == 0 && (!color || color.length == 0)) {
        color = props.primaryColor;
      }

      let seriesName = messages.Undefined;

      if (seriesData.seriesName && seriesData.seriesName.length > 0) {
        seriesName = seriesData.seriesName;
      }

      let config: Record<string, unknown> = {
        label: { show: props.showDataPointLabel, position: "top" },
        name: seriesName,
        itemStyle: { color: color },
      };

      switch (props.chartType) {
        case "BAR_CHART":
          config = { ...config, type: "bar" };

          // The series label should be on the right for bar chart
          (config.label as Record<string, unknown>).position = "right";
          break;
        case "COLUMN_CHART":
          config = { ...config, type: "bar" };
          break;
        case "LINE_CHART":
          config = { ...config, type: "line" };
          break;
        case "AREA_CHART":
          config = {
            ...config,
            type: "line",
            areaStyle: {},
          };
          break;
        case "PIE_CHART":
          config = this.#seriesConfigurationForPieChart(
            seriesID,
            seriesData,
            props.showDataPointLabel,
            layoutConfig,
          );
          break;
      }

      configs.push(config);
    });

    return configs;
  }

  seriesTitleOffsetForPieChart = (props: ChartComponentProps) => {
    return 0.3 * props.dimensions.componentHeight - 35;
  };

  #titleConfigForPiechart(
    props: ChartComponentProps,
    allSeriesData: AllChartData,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) {
    const config: Record<string, unknown>[] = [];

    Object.values(allSeriesData).forEach((seriesData) => {
      config.push({
        top: (layoutConfig.grid.top as number) - 20,
        left: props.dimensions.componentWidth / 2 - 5,
        textAlign: "center",
        text: seriesData.seriesName ?? "",
      });
    });

    return config;
  }

  #titleConfigForChart(
    props: ChartComponentProps,
    allSeriesData: AllChartData,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) {
    /**
     * title: [
     * {
     *  text: "chart title",
     * },
     * // Valid for PIE Chart only
     * {
     *
     *   text: "2014",
     *   top: "15%",
     *   left: "50%",
     *   textAlign: "center"
     *   }
     * ]
     */
    const defaultTitleConfig = {
      text: props.chartName,
      show: layoutConfig.title.show,
      padding: [15, 50],
      left: "center",
      textStyle: {
        fontFamily: this.fontFamily,
        fontSize: 24,
        color: Colors.THUNDER,
        overflow: "truncate",
        width: props.dimensions.componentWidth - 100,
      },
    };

    if (props.chartType == "PIE_CHART") {
      return [
        defaultTitleConfig,
        ...this.#titleConfigForPiechart(props, allSeriesData, layoutConfig),
      ];
    } else {
      return defaultTitleConfig;
    }
  }

  #configForLabelOrientation(props: ChartComponentProps) {
    if (props.chartType == "BAR_CHART") {
      return 0;
    }

    switch (props.labelOrientation) {
      case LabelOrientation.SLANT:
        return 45;
      case LabelOrientation.ROTATE:
        return 90;
      default:
        return 0;
    }
  }

  #defaultEChartConfig = (
    layoutConfig: Record<string, Record<string, unknown>>,
  ): Record<string, unknown> => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
      legend: {
        show: layoutConfig.legend.show,
        type: "scroll",
        left: "center",
        align: "left",
        top: layoutConfig.legend.top,
        orient: "horizontal",
        textStyle: { fontFamily: this.fontFamily },
        padding: [5, 50],
      },
      tooltip: {
        trigger: "item",
      },
    };

    config.grid = {
      top: layoutConfig.grid.top,
      bottom: layoutConfig.grid.bottom,
      left: layoutConfig.grid.left,
      show: false,
    };

    return config;
  };

  #yAxisConfig = (
    props: ChartComponentProps,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) => {
    /**
     * {
     *  type: "value", name: "Y Axis Name", nameLocation: "end"
     * }
     */
    let config: Record<string, unknown> = {
      show: layoutConfig.yAxis.show,
    };

    if (props.chartType != "PIE_CHART") {
      config = {
        ...config,
        name: props.yAxisName,
        nameLocation: "middle",
        nameGap: layoutConfig.yAxis.nameGap,
        nameTextStyle: {
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          color: Colors.DOVE_GRAY2,
        },
      };
    }

    if (props.chartType == "BAR_CHART") {
      config.type = "category";
    }

    if (props.setAdaptiveYMin) {
      config.min = "dataMin";
    }

    config.axisLabel = {
      fontFamily: this.fontFamily,
      color: Colors.DOVE_GRAY2,
      show: layoutConfig.yAxis.show,
      ...(layoutConfig.yAxis.axisLabel as Record<string, unknown>),
    };

    return config;
  };

  #xAxisConfig = (
    props: ChartComponentProps,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) => {
    /**
     * {
     *  type: "value", name: "X Axis Name", nameLocation: "end"
     * }
     */
    const config: Record<string, unknown> = {};
    let type = "category";

    if (props.chartType == "BAR_CHART") {
      type = "value";
    }

    config.type = type;
    config.axisLabel = {
      show: layoutConfig.xAxis.show,
      fontFamily: this.fontFamily,
      color: Colors.DOVE_GRAY2,
      rotate: this.#configForLabelOrientation(props),
      ...(layoutConfig.xAxis.axisLabel as Record<string, unknown>),
    };

    if (props.chartType == "BAR_CHART" && props.setAdaptiveYMin) {
      config.min = "dataMin";
    }

    if (props.chartType != "PIE_CHART") {
      config.name = props.xAxisName;
      config.nameLocation = "middle";
      config.nameGap = layoutConfig.xAxis.nameGap;
      config.nameTextStyle = {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        color: Colors.DOVE_GRAY2,
      };
    }

    config.show = layoutConfig.xAxis.show;

    return config;
  };

  #scrollConfig = (
    props: ChartComponentProps,
    layoutConfig: Record<string, Record<string, unknown>>,
  ) => {
    if (props.allowScroll) {
      if (props.chartType != "PIE_CHART") {
        return [
          {
            show: layoutConfig.scrollBar.show,
            type: "slider",
            filterMode: "filter",
            start: "0",
            end: "50",
            bottom: layoutConfig.scrollBar.bottom,
            height: layoutConfig.scrollBar.height,
          },
          {
            show: layoutConfig.scrollBar.show,
            type: "inside",
            filterMode: "filter",
            start: "0",
            end: "50",
          },
        ];
      }
    }

    return [];
  };

  prepareEChartConfig(
    props: ChartComponentProps,
    allSeriesData: AllChartData,
    longestLabels: LongestLabelParams,
  ) {
    this.fontFamily = props.fontFamily;
    const layoutBuilder = new EChartsLayoutBuilder({
      allowScroll: props.allowScroll,
      widgetHeight: props.dimensions.componentHeight,
      widgetWidth: props.dimensions.componentWidth,
      labelOrientation: props.labelOrientation ?? LabelOrientation.AUTO,
      chartType: props.chartType,
      chartTitle: props.chartName,
      seriesConfigs: props.chartData,
      font: `${this.fontSize}px ${this.fontFamily}`,
      longestLabels: longestLabels,
    });
    const layoutConfig: Record<
      string,
      Record<string, unknown>
    > = layoutBuilder.layoutConfig;

    const chartConfig: Record<string, unknown> =
      this.#defaultEChartConfig(layoutConfig);

    chartConfig.title = this.#titleConfigForChart(
      props,
      allSeriesData,
      layoutConfig,
    );
    chartConfig.xAxis = this.#xAxisConfig(props, layoutConfig);
    chartConfig.yAxis = this.#yAxisConfig(props, layoutConfig);

    chartConfig.dataZoom = this.#scrollConfig(props, layoutConfig);
    chartConfig.series = this.#seriesConfigForChart(
      props,
      allSeriesData,
      layoutConfig,
    );

    return chartConfig;
  }
}
