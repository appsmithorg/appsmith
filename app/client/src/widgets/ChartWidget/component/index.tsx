import React from "react";
import styled from "styled-components";
import * as echarts from "echarts";
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
import { isBasicEChart } from "../widget";
import { parseOnDataPointClickParams } from "./helpers";
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
  customEChartsAdvanceConfigurations?: Record<string, unknown>[]
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

  constructor(props: ChartComponentProps) {
    super(props);
    this.echartsConfigurationBuilder = new EChartsConfigurationBuilder();

    this.state = {
      eChartsError: undefined,
      chartType: this.props.chartType,
    };
  }

  getBasicEChartOptions = () => {
    const chartData = EChartsDatasetBuilder.chartData(
      this.props.chartType,
      this.props.chartData,
    );
    const options = {
      ...this.echartsConfigurationBuilder.prepareEChartConfig(
        this.props,
        chartData,
      ),
      dataset: {
        ...EChartsDatasetBuilder.datasetFromData(chartData),
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

  findKey = (obj : any, id : any) : any => {
    const myFun = () => { 1+2 }
    const myFunString = myFun.toString()
    // console.log("***", "my func string is ", myFunString)

    const evaluatedFunc = new Function("return " + myFunString)
    // console.log("***", "evaluated func is ", evaluatedFunc()())
    // console.log("find key called for obj ", JSON.stringify(obj))
    
    if (typeof(obj) !== "object") {
        return null;
    }

    // console.log("obj.id is ", obj.id, " id is ", id)
    if (obj.id == id) {
        // console.log("coming in if")
        return obj
    } else {
        const keys = Object.keys(obj)
        // console.log("keys is ", keys)
        for (const key of keys) {
            // console.log("calling find key for ", obj[key])
            const result = this.findKey(obj[key], id)
            // console.log("result for obj ", JSON.stringify(obj[key]), " is ", result)
            if (result) {
                return result
            }
        }
        return null
    }
}

  getCustomEChartOptions = () => {
    const options = JSON.parse(JSON.stringify(this.props.customEChartConfig))

    const configs = this.props.customEChartsAdvanceConfigurations ?? []
    for (const c of configs) {
      const key : string = c.key as string
      const id = c.id
      const fn = c.function
      const values = c.values

      const config = this.findKey(options, id)
      if(config) {
        if (fn) {
          const assignFunc = (new Function("return " + c.function))()
          // console.log("***", "assign func is ", assignFunc)
          config[key] = assignFunc
        } else if (values) {
          const assignFunc = (new Function("return " + `(value, params) => {
              return ${JSON.stringify(values)}[params.dataIndex]
            }
          `))()
          // console.log("***", "assign func is ", assignFunc)
          config[key] = assignFunc
        }
      }
    }
    return options;
  };

  renderECharts = () => {
    this.initializeEchartsInstance();

    if (!this.echartsInstance) {
      return;
    }

    let eChartOptions: Record<string, unknown> = {};
    if (this.isCustomEChart(this.state.chartType)) {
      eChartOptions = this.getCustomEChartOptions();
    } else if (isBasicEChart(this.state.chartType)) {
      eChartOptions = this.getBasicEChartOptions();
    }

    try {
      if (!equal(this.echartConfiguration, eChartOptions)) {
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
    // console.log("***", "component did update")
    // console.log("***", "callback function is ", this.props.customEChartsAdvanceConfigurations)
    if (
      this.isCustomFusionChart(this.props.chartType) &&
      !this.isCustomFusionChart(this.state.chartType)
    ) {
      this.setState({
        eChartsError: undefined,
        chartType: "CUSTOM_FUSION_CHART",
      });
    } else if (
      this.isCustomEChart(this.props.chartType) &&
      !this.isCustomEChart(this.state.chartType)
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

  isCustomFusionChart(type: ChartType) {
    return type == "CUSTOM_FUSION_CHART";
  }

  isCustomEChart(type: ChartType) {
    return type == "CUSTOM_ECHART";
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
