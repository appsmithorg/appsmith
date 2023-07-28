import { get } from "lodash";
import React from "react";
import styled from "styled-components";
import * as echarts from "echarts";
import { invisible } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "@appsmith/configs";
import type {
  ChartType,
  CustomFusionChartConfig,
  AllChartData,
  ChartData,
  ChartSelectedDataPoint,
  LabelOrientation,
} from "../constants";

import log from "loglevel";
import equal from "fast-deep-equal/es6";
import type { WidgetPositionProps } from "widgets/BaseWidget";
import { ChartErrorComponent } from "./ChartErrorComponent";
import { EChartsConfigurationBuilder } from "./EChartsConfigurationBuilder";
import { EChartsDatasetBuilder } from "./EChartsDatasetBuilder";
// Leaving this require here. Ref: https://stackoverflow.com/questions/41292559/could-not-find-a-declaration-file-for-module-module-name-path-to-module-nam/42505940#42505940
// FusionCharts comes with its own typings so there is no need to separately import them. But an import from fusioncharts/core still requires a declaration file.
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

  eChartsData: ChartData[] = [];
  echartsConfigurationBuilder: EChartsConfigurationBuilder;

  echartConfiguration: Record<string, any> = {};

  constructor(props: ChartComponentProps) {
    super(props);
    this.echartsConfigurationBuilder = new EChartsConfigurationBuilder();

    this.state = {
      eChartsError: undefined,
      chartType: this.props.chartType,
    };
  }

  getEChartsOptions = () => {
    const options = {
      ...this.echartsConfigurationBuilder.prepareEChartConfig(
        this.props,
        this.eChartsData,
      ),
      dataset: {
        ...EChartsDatasetBuilder.datasetFromData(this.eChartsData),
      },
    };
    return options;
  };

  dataClickCallback = (params: echarts.ECElementEvent) => {
    const eventData: Record<string, unknown> = params.data as Record<
      string,
      unknown
    >;
    const yValue = params.seriesName ? eventData[params.seriesName] : 0;
    const chartSelectedPoint: ChartSelectedDataPoint = {
      x: eventData.xaxiscategoryname,
      y: yValue,
      seriesTitle: params.seriesName || "",
    };
    this.props.onDataPointClick(chartSelectedPoint);
  };

  initializeEchartsInstance = () => {
    this.eChartsHTMLContainer = document.getElementById(
      this.eChartsContainerId,
    );
    if (!this.eChartsHTMLContainer) {
      return;
    }

    if (!this.echartsInstance || this.echartsInstance.isDisposed()) {
      this.echartsInstance = echarts.init(
        this.eChartsHTMLContainer,
        undefined,
        {
          renderer: "svg",
        },
      );
    }
  };

  resizeEchartsIfNeeded = () => {
    if (this.echartsInstance) {
      if (
        this.echartsInstance.getHeight() !=
          this.props.dimensions.componentHeight ||
        this.echartsInstance.getWidth() != this.props.dimensions.componentWidth
      ) {
        this.echartsInstance.resize({
          width: this.props.dimensions.componentWidth,
          height: this.props.dimensions.componentHeight,
        });
      }
    }
  };

  renderECharts = () => {
    this.initializeEchartsInstance();

    if (!this.echartsInstance) {
      return;
    }

    const newConfiguration = this.getEChartsOptions();
    let needsNewConfig = true;

    if (
      this.state.eChartsError &&
      equal(newConfiguration, this.echartConfiguration)
    ) {
      // this check is required if chartError is present and the code shouldn't calculate the same error again
      needsNewConfig = false;
    } else {
      this.echartConfiguration = newConfiguration;
    }

    try {
      this.echartsInstance.off("click");
      this.echartsInstance.on("click", this.dataClickCallback);

      if (needsNewConfig) {
        this.echartsInstance.setOption(this.echartConfiguration, true);
        if (this.state.eChartsError) {
          this.setState({ eChartsError: undefined });
        }
      }

      this.resizeEchartsIfNeeded();
    } catch (error) {
      this.disposeECharts();
      this.setState({ eChartsError: error as Error });
    }
  };

  disposeECharts = () => {
    this.echartsInstance?.dispose();
  };

  componentDidMount() {
    this.eChartsData = EChartsDatasetBuilder.chartData(this.props);
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
      this.initializeEchartsInstance();
      this.renderECharts();
    }
  }

  componentDidUpdate() {
    if (
      this.props.chartType == "CUSTOM_FUSION_CHART" &&
      this.state.chartType != "CUSTOM_FUSION_CHART"
    ) {
      this.setState({
        eChartsError: undefined,
        chartType: "CUSTOM_FUSION_CHART",
      });
    } else if (
      this.props.chartType != "CUSTOM_FUSION_CHART" &&
      this.state.chartType === "CUSTOM_FUSION_CHART"
    ) {
      // User has selected one of the ECharts option
      this.setState({ chartType: "AREA_CHART" });
    } else {
      this.eChartsData = EChartsDatasetBuilder.chartData(this.props);
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
          const data = evt.data;
          const seriesTitle = get(data, "datasetName", "");
          this.props.onDataPointClick({
            x: data.categoryLabel,
            y: data.dataValue,
            seriesTitle,
          });
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
