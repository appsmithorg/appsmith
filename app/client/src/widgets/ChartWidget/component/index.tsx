import React from "react";
import styled from "styled-components";
import * as echarts from "echarts";
import { invisible } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "ee/configs";
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
import { dataClickCallbackHelper, isBasicEChart } from "./helpers";
import {
  parseOnDataPointClickParams,
  isCustomEChart,
  isCustomFusionChart,
  chartOptions,
} from "./helpers";

import { CustomEChartIFrameComponent } from "./CustomEChartIFrameComponent";
import type { AppState } from "ee/reducers";
import { connect } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
// Leaving this require here. Ref: https://stackoverflow.com/questions/41292559/could-not-find-a-declaration-file-for-module-module-name-path-to-module-nam/42505940#42505940
// FusionCharts comes with its own typings so there is no need to separately import them. But an import from fusioncharts/core still requires a declaration file.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FusionCharts = require("fusioncharts");
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  fontFamily: string;
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
}`;

export type ChartComponentConnectedProps = ReturnType<typeof mapStateToProps> &
  ChartComponentProps;
class ChartComponent extends React.Component<
  ChartComponentConnectedProps,
  ChartComponentState
> {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fusionChartsInstance: any = null;
  echartsInstance: echarts.ECharts | undefined;

  customFusionChartContainerId =
    this.props.widgetId + "custom-fusion-chart-container";

  eChartsContainerId = this.props.widgetId + "echart-container";
  eChartsHTMLContainer: HTMLElement | null = null;

  echartsConfigurationBuilder: EChartsConfigurationBuilder;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echartConfiguration: Record<string, any> = {};
  prevProps: ChartComponentProps;

  constructor(props: ChartComponentConnectedProps) {
    super(props);
    this.echartsConfigurationBuilder = new EChartsConfigurationBuilder();
    this.prevProps = {} as ChartComponentProps;

    this.state = {
      eChartsError: undefined,
      chartType: this.props.chartType,
    };
  }

  dataClickCallback = (params: echarts.ECElementEvent) => {
    dataClickCallbackHelper(params, this.props, this.state.chartType);
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shouldSetOptions(eChartOptions: any) {
    return !equal(this.echartConfiguration, eChartOptions);
  }

  renderECharts = () => {
    this.initializeEchartsInstance();

    if (!this.echartsInstance) {
      return;
    }

    const eChartOptions: Record<string, unknown> = chartOptions(
      this.state.chartType,
      this.props,
    );

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
    } else if (this.state.chartType == "CUSTOM_ECHART") {
      this.disposeECharts();
      this.disposeFusionCharts();
    } else {
      this.disposeFusionCharts();
      this.renderECharts();
    }
  }

  componentDidUpdate() {
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        {isBasicEChart(this.state.chartType) && (
          <ChartsContainer id={this.eChartsContainerId} />
        )}

        {isCustomEChart(this.state.chartType) && (
          <CustomEChartIFrameComponent {...this.props} />
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

/**
 * TODO: Balaji to refactor code to move out selected widget details to platform
 */
export const mapStateToProps = (
  state: AppState,
  ownProps: ChartComponentProps,
) => {
  const isPreviewMode = combinedPreviewModeSelector(state);
  const appMode = getAppMode(state);
  return {
    needsOverlay:
      appMode == APP_MODE.EDIT &&
      !isPreviewMode &&
      ownProps.widgetId !== getWidgetPropsForPropertyPane(state)?.widgetId,
  };
};

export default connect(mapStateToProps)(ChartComponent);
