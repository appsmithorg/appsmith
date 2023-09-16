import React from "react";
import styled from "styled-components";
import * as echarts from "echarts";
import "echarts-gl";
import { invisible } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "@appsmith/configs";
import type {
  ChartType,
  CustomFusionChartConfig,
  AllChartData,
  ChartSelectedDataPoint,
  LabelOrientation,
} from "../constants";

import log from "loglevel";
import equal from "fast-deep-equal/es6";
import type { WidgetPositionProps } from "widgets/BaseWidget";
import { ChartErrorComponent } from "./ChartErrorComponent";
import { EChartsConfigurationBuilder } from "./EChartsConfigurationBuilder";
import { EChartsDatasetBuilder } from "./EChartsDatasetBuilder";
import {
  generateEChartInstanceDisposalParams,
  is3DChart,
  isBasicEChart,
  shouldDisposeEChartsInstance,
} from "./helpers";
import {
  parseOnDataPointClickParams,
  isCustomEChart,
  isCustomFusionChart,
} from "./helpers";
// Leaving this require here. Ref: https://stackoverflow.com/questions/41292559/could-not-find-a-declaration-file-for-module-module-name-path-to-module-nam/42505940#42505940
// FusionCharts comes with its own typings so there is no need to separately import them. But an import from fusioncharts/core still requires a declaration file.
// eslint-disable-next-line @typescript-eslint/no-var-requires
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

export interface ChartComponentState {
  eChartsError: Error | undefined;
  chartType: ChartType;
}

export interface ChartComponentProps extends WidgetPositionProps {
  allowScroll: boolean;
  chartData: AllChartData;
  chartName: string;
  chartType: ChartType;
  customEChartConfig: Record<string, unknown>;
  customFusionChartConfig: CustomFusionChartConfig;
  hasOnDataPointClick: boolean;
  isVisible?: boolean;
  isLoading: boolean;
  setAdaptiveYMin: boolean;
  labelOrientation?: LabelOrientation;
  onDataPointClick: (selectedDataPoint: ChartSelectedDataPoint) => void;
  widgetId: string;
  xAxisName: string;
  yAxisName: string;
  borderRadius: string;
  boxShadow?: string;
  primaryColor?: string;
  showDataPointLabel: boolean;
  fontFamily?: string;
  dimensions: {
    componentWidth: number;
    componentHeight: number;
  };
}

const ChartsContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const CanvasContainer = styled.div<
  Omit<ChartComponentProps, "onDataPointClick" | "hasOnDataPointClick">
>`
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;

  height: 100%;
  width: 100%;
  background: var(--ads-v2-color-bg);
  overflow: hidden;
  position: relative;
  ${(props) => (!props.isVisible ? invisible : "")};
  padding: 10px 0 0 0;
}`;

class ChartComponent extends React.Component<
  ChartComponentProps,
  ChartComponentState
> {
  fusionChartsInstance: any = null;
  echartsInstance: echarts.ECharts | undefined;

  customFusionChartContainerId =
    this.props.widgetId + "custom-fusion-chart-container";
  eChartsContainerId = this.props.widgetId + "echart-container";
  eChartsHTMLContainer: HTMLElement | null = null;

  echartsConfigurationBuilder: EChartsConfigurationBuilder;

  echartConfiguration: Record<string, any> = {};
  is3DChart = false;
  prevProps: ChartComponentProps;

  constructor(props: ChartComponentProps) {
    super(props);
    this.echartsConfigurationBuilder = new EChartsConfigurationBuilder();
    this.prevProps = {} as ChartComponentProps;

    this.state = {
      eChartsError: undefined,
      chartType: this.props.chartType,
    };
  }

  getBasicEChartOptions = () => {
    const datasetBuilder = new EChartsDatasetBuilder(
      this.props.chartType,
      this.props.chartData,
    );
    const dataset = datasetBuilder.datasetFromData();

    const options = {
      ...this.echartsConfigurationBuilder.prepareEChartConfig(
        this.props,
        datasetBuilder.filteredChartData,
        datasetBuilder.longestDataLabels(),
      ),
      dataset: {
        ...dataset,
      },
    };
    return options;
  };

  dataClickCallback = (params: echarts.ECElementEvent) => {
    const dataPointClickParams = parseOnDataPointClickParams(
      params,
      this.state.chartType,
    );

    this.props.onDataPointClick(dataPointClickParams);
  };

  initializeEchartsInstance = () => {
    this.eChartsHTMLContainer = document.getElementById(
      this.eChartsContainerId,
    );
    if (!this.eChartsHTMLContainer) {
      return;
    }

    // console.log("***", "prev props is ", this.prevProps.chartType)
    // console.log("***", "current props is ", this.props.chartType)

    this.is3DChart = is3DChart(this.props.customEChartConfig);
    // console.log("***", "is 3d chart ", this.is3DChart)

    let shouldDisposeEcharts = true;
    if (Object.keys(this.prevProps).length == 0) {
      shouldDisposeEcharts = true;
      // console.log("***", "should dispose echarts because prev props is not present", shouldDisposeEcharts)
    } else {
      const config = generateEChartInstanceDisposalParams(
        this.prevProps,
        this.props,
      );
      // console.log("***", "params is ", config)
      shouldDisposeEcharts = shouldDisposeEChartsInstance(config);
    }

    this.prevProps = this.props;
    // console.log("***", "should dispose echarts", shouldDisposeEcharts)

    if (shouldDisposeEcharts) {
      this.echartsInstance?.dispose();
    }

    if (!this.echartsInstance || this.echartsInstance.isDisposed()) {
      // console.log("***", "rendering new chart instance")
      this.echartsInstance?.dispose();
      this.echartsInstance = echarts.init(
        this.eChartsHTMLContainer,
        undefined,
        {
          renderer: this.is3DChart ? "canvas" : "svg",
          width: this.props.dimensions.componentWidth,
          height: this.props.dimensions.componentHeight,
        },
      );
    }
  };

  shouldResizeECharts = () => {
    return (
      this.echartsInstance?.getHeight() !=
        this.props.dimensions.componentHeight ||
      this.echartsInstance?.getWidth() != this.props.dimensions.componentWidth
    );
  };

  getCustomEChartOptions = () => {
    return this.props.customEChartConfig;
  };

  shouldSetOptions(eChartOptions: any) {
    if (equal(this.echartConfiguration, eChartOptions)) {
      if (this.is3DChart) {
        return (
          this.state.eChartsError == undefined ||
          this.state.eChartsError == null
        );
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  renderECharts = () => {
    this.initializeEchartsInstance();

    if (!this.echartsInstance) {
      return;
    }

    let eChartOptions: Record<string, unknown> = {};
    if (isCustomEChart(this.state.chartType)) {
      // console.log("***", "rendering custom e chart")
      eChartOptions = this.getCustomEChartOptions();
    } else if (isBasicEChart(this.state.chartType)) {
      // console.log("***", "rendering basic chart")
      eChartOptions = this.getBasicEChartOptions();
    }

    try {
      if (this.shouldSetOptions(eChartOptions)) {
        this.echartConfiguration = eChartOptions;
        this.echartsInstance.setOption(this.echartConfiguration, true);

        if (this.state.eChartsError) {
          this.setState({ eChartsError: undefined });
        }
      }

      if (this.shouldResizeECharts()) {
        this.echartsInstance.resize({
          width: this.props.dimensions.componentWidth,
          height: this.props.dimensions.componentHeight,
        });
      }

      this.echartsInstance.off("click");
      this.echartsInstance.on("click", this.dataClickCallback);
    } catch (error) {
      this.disposeECharts();
      this.setState({ eChartsError: error as Error });
    }
  };

  disposeECharts = () => {
    if (!this.echartsInstance?.isDisposed()) {
      this.echartsInstance?.dispose();
    }
  };

  componentDidMount() {
    this.renderChartingLibrary();
  }

  componentWillUnmount() {
    this.disposeECharts();
    this.disposeFusionCharts();
  }

  renderChartingLibrary() {
    if (this.state.chartType === "CUSTOM_FUSION_CHART") {
      this.disposeECharts();
      this.renderFusionCharts();
    } else {
      this.disposeFusionCharts();
      this.renderECharts();
    }
  }

  componentDidUpdate() {
    // console.log("***", "component did update called prev ", prevProps.chartType, " current chart type ", this.props.chartType)

    if (
      isCustomFusionChart(this.props.chartType) &&
      !isCustomFusionChart(this.state.chartType)
    ) {
      this.setState({
        eChartsError: undefined,
        chartType: "CUSTOM_FUSION_CHART",
      });
    } else if (
      isCustomEChart(this.props.chartType) &&
      !isCustomEChart(this.state.chartType)
    ) {
      this.echartConfiguration = {};
      this.setState({ eChartsError: undefined, chartType: "CUSTOM_ECHART" });
    } else if (
      isBasicEChart(this.props.chartType) &&
      !isBasicEChart(this.state.chartType)
    ) {
      // User has selected one of the ECharts option
      this.echartConfiguration = {};
      this.setState({
        eChartsError: undefined,
        chartType: this.props.chartType,
      });
    } else {
      // console.log("***", "render charting library")
      this.renderChartingLibrary();
    }
  }

  disposeFusionCharts = () => {
    this.fusionChartsInstance = null;
  };

  renderFusionCharts = () => {
    if (this.fusionChartsInstance) {
      const { dataSource, type } = this.getCustomFusionChartDataSource();
      this.fusionChartsInstance.chartType(type);
      this.fusionChartsInstance.setChartData(dataSource);
    } else {
      const config = this.customFusionChartConfig();
      this.fusionChartsInstance = new FusionCharts(config);

      FusionCharts.ready(() => {
        /* Component could be unmounted before FusionCharts is ready,
          this check ensure we don't render on unmounted component */
        if (this.fusionChartsInstance) {
          try {
            this.fusionChartsInstance.render();
          } catch (e) {
            log.error(e);
          }
        }
      });
    }
  };

  customFusionChartConfig() {
    const chartConfig = {
      renderAt: this.customFusionChartContainerId,
      width: "100%",
      height: "100%",
      events: {
        dataPlotClick: (evt: any) => {
          const dataPointClickParams = parseOnDataPointClickParams(
            evt,
            this.state.chartType,
          );

          this.props.onDataPointClick(dataPointClickParams);
        },
      },
      ...this.getCustomFusionChartDataSource(),
    };
    return chartConfig;
  }

  getCustomFusionChartDataSource = () => {
    // in case of evaluation error, customFusionChartConfig can be undefined
    let config = this.props.customFusionChartConfig as CustomFusionChartConfig;

    if (config && config.dataSource) {
      config = {
        ...config,
        dataSource: {
          chart: {
            ...config.dataSource.chart,
            caption: this.props.chartName || config.dataSource.chart.caption,
            setAdaptiveYMin: this.props.setAdaptiveYMin ? "1" : "0",
          },
          ...config.dataSource,
        },
      };
    }
    return config || {};
  };

  render() {
    //eslint-disable-next-line  @typescript-eslint/no-unused-vars
    const { hasOnDataPointClick, onDataPointClick, ...rest } = this.props;

    // Avoid propagating the click events to upwards
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onClick = hasOnDataPointClick
      ? (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation()
      : undefined;

    return (
      <CanvasContainer
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        onClick={onClick}
        {...rest}
      >
        {this.state.chartType !== "CUSTOM_FUSION_CHART" && (
          <ChartsContainer id={this.eChartsContainerId} />
        )}

        {this.state.chartType === "CUSTOM_FUSION_CHART" && (
          <ChartsContainer id={this.customFusionChartContainerId} />
        )}

        {this.state.eChartsError && (
          <ChartErrorComponent error={this.state.eChartsError} />
        )}
      </CanvasContainer>
    );
  }
}

export default ChartComponent;
