import React, { useEffect } from "react";
import ReactDOMServer from "react-dom/server"
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
import PropertySection from "pages/Editor/PropertyPane/PropertySection";
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
  height: 10%;
  width: 10%;
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

const EChartsIframe = (props : any) => {
  // let eChartsHTMLContainer : any

  // useEffect(() => {
  //   eChartsHTMLContainer = document.getElementById(
  //     "mainrajat",
  //   );
  //   if (!eChartsHTMLContainer) {
  //     return;
  //   }
  //   const echartsInstance = echarts.init(eChartsHTMLContainer)
  //   echar
  // }, [])

  // const options = () => {
    

  //   return {
  //     name: props.name
  //   }
  // }

  // const jsString = () => {

  // }

  return (
    <div>
      <div>This is the content rendered inside iframe</div>
      <div id="mainrajat">
        
      </div>
      <script src="echartoptions.js"></script>
    </div>
  )
}

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

  disposeEChartsIfNeeded() {
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
  }

  // <script src="/libraries/echarts.min.js"></script>
  jsString = `
    <head>
      <style type="text/css">
        body {
            margin:0 0 0 0px;
        }
      </style>
      
      <script src="/libraries/echarts.min.js"></script>
      <script src="
https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
"></script>
    <script src="https://cdn.jsdelivr.net/npm/echarts-gl/dist/echarts-gl.min.js"></script>
    </head>
    <body>
    <div id="mainrajat" style="height: 100%; width: 100%;"></div>

    <script>
      console.log("chartwidget", "window is ", window.document);
      console.log("*********", "document is ", document);

      const fetchString = \`
      fetch("https://dev.appsmith.com/api/v1/pages/6512ed006cb2e47351e4ecdd", {
        "headers": {
          
        },
        "method": "GET",
        "credentials" : "include"
      }).then((response) => {
        console.log("xssattack", "response 123from fetch is ", response)
        return response.text()
      }).then((textResponse) => {
        console.log("xssattack", "text response 123 from fetch is ", textResponse)
      }).catch((error) => {
        console.log("xssattack", "error in catch is ", error)
      })\`
    
    
    eval(fetchString)

      let options = "rajat"
      const echartsElement = document.getElementById("mainrajat")
      // console.log("chartwidget", "IFrame document height is ", document.window.height, " width is ", document.window.width)
      const echartsInstance = echarts.init(echartsElement, undefined, { width: document.width, height: document.height})

      window.onload = () => {
        console.log("chartwidget", "iframe has finished loading")
        top.postMessage("loadcomplete", "*")
      }
      window.onmessage = function(e) {
        console.log("chartwidget", "e.data is ", e.data)
        
        try {
          console.log("*********", "this.options before is ", options, "e.data is ", e.data)
          config = e.data
          options = config.options
          console.log("*********", "this.options after is ", options, " config is ", config)

          const parsedOptions = JSON.parse(options)
          const newOptions = parseFunctions(parsedOptions)
          console.log("chartwidget", "setting options to echarts ", newOptions)
          echartsInstance.setOption(newOptions)
          echartsInstance.resize({ width: config.width, height: config.height })
        } catch(error) {
          console.log("chartwidget", "error in catch ", error)
        }
        
          // if (e.data == 'hello') {
          //     alert('It works!');
          // }
          // top.postMessage("this is message from iframe", "*")
      };
      function parseFunctions(configuration) {
        const newConfiguration = JSON.parse(JSON.stringify(configuration))
        let fnKeys = configuration['__fn_keys__'] ?? []
        // fnKeys = ['series.symbolSize']
        
        console.log("*********", "configuration is ",configuration, " fn keys is ", fnKeys)
    
        for (const fnKey of fnKeys) {
          const fnString = _.get(configuration, fnKey)
          console.log("*********", "fn string is ", fnString, " configuration is ", configuration)
          const fn = (new Function("return " + fnString))()
          console.log("*********", "fn is ", fn)
    
          
          _.set(newConfiguration, fnKey, fn)
        }
        console.log("*********", "CONFIGURATION AFTER OVERRIDE IS  ", newConfiguration)
        return newConfiguration
      }

      // try {
      //   console.log("*********", "coming in try")
        
      // const newOptions = parseFunctions(options)
      // console.log("*********", "options string is ", options, " new options is ", newOptions)
      // console.log("*********", "echarts element is ", echartsElement, options)
      
      // // const fnObj = (new Function("return " + "() => {}"))()
      // // console.log("*********", "fn obj is ", fnObj, typeof(fnObj))
      // console.log("*********", "setting options is ", newOptions)
      // echartsInstance.setOption(newOptions)
      // } catch(error) {
      //   console.log("*********", "coming in catch ", error)
      // }

      
    </script>
    </body>
    
    `
  //   return result
  // }

  initializeEchartsInstance = async () => {
    this.eChartsHTMLContainer = document.getElementById(
      this.eChartsContainerId,
    );
    if (!this.eChartsHTMLContainer) {
      return;
    }

    // console.log("***", "prev props is ", this.prevProps.chartType)
    // console.log("***", "current props is ", this.props.chartType)

    this.disposeEChartsIfNeeded()

    this.is3DChart = is3DChart(this.props.customEChartConfig);
    // console.log("***", "is 3d chart ", this.is3DChart)

    if (this.is3DChart) {
      // await import("echarts-gl")
    }

    if (!this.echartsInstance || this.echartsInstance.isDisposed()) {
      // console.log("***", "rendering new chart instance")
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

  findObjectWithID = (obj : any, id : any) : any => {    
    if (typeof(obj) !== "object") {
        return null;
    }

    if (obj.id == id) {
        return obj
    } else {
        const keys = Object.keys(obj)
        for (const key of keys) {
            const result = this.findObjectWithID(obj[key], id)
            if (result) {
                return result
            }
        }
        return null
    }
  }

  getCustomEChartOptions = () => {
    const options = this.props.customEChartConfig

    // const configs = this.props.customEChartsAdvanceConfigurations ?? []
    // for (const c of configs) {
    //   const key : string = c.key as string
    //   const id = c.id
    //   const fn = c.fn

    //   // const config = this.findObjectWithID(options, id)
    //   // if(config) {
    //     if (fn) {
    //       console.log("proppane", "going to create a function")
          // debugger;
          // const assignFunc = (new Function("return " + fn))()
          // config[key] = assignFunc
        // }
      // }
    // }
    console.log("widgetlog", "going to assign options", options)
    return options;
  };

  shouldSetOptions(eChartOptions: any) {
    console.log("*********", "should set options called")
    // if (equal(this.echartConfiguration, eChartOptions)) {
    //   if (this.is3DChart) {
    //     return (
    //       this.state.eChartsError == undefined ||
    //       this.state.eChartsError == null
    //     );
    //   } else {
    //     return false;
    //   }
    // } else {
      return true;
    // }
  }

  renderECharts = async () => {
    // await this.initializeEchartsInstance();

    // if (!this.echartsInstance) {
    //   return;
    // }

    let eChartOptions: Record<string, unknown> = {};
    if (isCustomEChart(this.state.chartType)) {
      // console.log("***", "rendering custom e chart")
      eChartOptions = this.getCustomEChartOptions();
    } else if (isBasicEChart(this.state.chartType)) {
      // console.log("***", "rendering basic chart")
      eChartOptions = this.getBasicEChartOptions();
    }
    

    try {
      // if (this.shouldSetOptions(eChartOptions)) {
        this.echartConfiguration = eChartOptions;
        console.log("chartwidget", "render echarts function, config is ", this.echartConfiguration, " echart options is ", eChartOptions)
        const iFrameWindow =  (document?.getElementById("chartiframe") as any).contentWindow
        console.log("chartwidget", "going to send message to iframe with window ", iFrameWindow)
        iFrameWindow.postMessage({options: JSON.stringify(this.echartConfiguration), width: this.props.dimensions.componentWidth, height: this.props.dimensions.componentHeight }, "*")
        // this.echartsInstance.setOption(this.echartConfiguration, true);
        // const stringifiedOptions = this.jsString(this.echartConfiguration)
        // console.log("*********", "stringified options are ", this.echartConfiguration)

        if (this.state.eChartsError) {
          this.setState({ eChartsError: undefined });
        }
      // } else {
      //   console.log("*********", "should not set options")
      // }

      // if (this.shouldResizeECharts()) {
      //   this.echartsInstance.resize({
      //     width: this.props.dimensions.componentWidth,
      //     height: this.props.dimensions.componentHeight,
      //   });
      // }

      // this.echartsInstance.off("click");
      // this.echartsInstance.on("click", this.dataClickCallback);
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

  async componentDidMount() {
    console.log("chartwidget", "component did mount")
    window.onmessage = (event : Event) => {
      console.log("********", "chart component received message ", event)

      const iFrameWindow =  (document?.getElementById("chartiframe") as any).contentWindow
      console.log("chartwidget", "IN COMPONENT DID MOUNT : going to send message to iframe with window ", iFrameWindow)
      iFrameWindow.postMessage({options: JSON.stringify(this.echartConfiguration), width: this.props.dimensions.componentWidth-10, height: this.props.dimensions.componentHeight-10 }, "*")    
    }
    await this.renderChartingLibrary();
  }

  componentWillUnmount() {
    this.disposeECharts();
    this.disposeFusionCharts();
  }

  async renderChartingLibrary() {
    if (this.state.chartType === "CUSTOM_FUSION_CHART") {
      this.disposeECharts();
      this.renderFusionCharts();
    } else {
      this.disposeFusionCharts();
      console.log("*********", "going to render echarts")
      await this.renderECharts();
    }
  }

  async componentDidUpdate() {
    console.log("chartwidget", "component did update called")

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
      await this.renderChartingLibrary();
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

  // divString() {
  //   return `<div id=${this.eChartsContainerId}><div><script></script>>`
  // }

  render() {
    console.log("chartwidget",  "render function called")
    //eslint-disable-next-line  @typescript-eslint/no-unused-vars
    const { hasOnDataPointClick, onDataPointClick, ...rest } = this.props;
    // const stringRender = ReactDOMServer.renderToString(<EChartsIframe></EChartsIframe>)
    // console.log("*********", "string render is ", stringRender)
    console.log("chartwidget", "echarts configuration for in render method is ", this.echartConfiguration)
    const optionsString = JSON.stringify(this.echartConfiguration)
    // console.log("*********", "options string is ", optionsString)

    // Avoid propagating the click events to upwards
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onClick = hasOnDataPointClick
      ? (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation()
      : undefined;

      // <iframe id="chartiframe" style={{height: "100%", width: "100%"}} srcDoc={this.jsString(optionsString)}></iframe>  
    return (
      <CanvasContainer
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        onClick={onClick}
        {...rest}
      >
        {this.state.chartType !== "CUSTOM_FUSION_CHART" && (  
          <iframe id="chartiframe" style={{height: "100%", width: "100%", overflow: "hidden"}} sandbox="allow-scripts" srcDoc={this.jsString}></iframe>  
          // <ChartsContainer id={this.eChartsContainerId} />
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
