import React, { lazy, Suspense } from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import propertyConfig, { contentConfig, styleConfig } from "./propertyConfig";
import {
  ChartType,
  CustomFusionChartConfig,
  AllChartData,
  ChartSelectedDataPoint,
} from "../constants";

import { WidgetType } from "constants/WidgetConstants";
import { ChartComponentProps } from "../component";
import { Colors } from "constants/Colors";

const ChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "../component"
    ),
  ),
);

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getPropertyPaneConfig() {
    return propertyConfig;
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  onDataPointClick = (selectedDataPoint: ChartSelectedDataPoint) => {
    this.props.updateWidgetMetaProperty(
      "selectedDataPoint",
      selectedDataPoint,
      {
        triggerPropertyName: "onDataPointClick",
        dynamicString: this.props.onDataPointClick,
        event: {
          type: EventType.ON_DATA_POINT_CLICK,
        },
      },
    );
  };

  getPageView() {
    return (
      <Suspense fallback={<Skeleton />}>
        <ChartComponent
          allowScroll={this.props.allowScroll}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          chartData={this.props.chartData}
          chartName={this.props.chartName}
          chartType={this.props.chartType}
          customFusionChartConfig={this.props.customFusionChartConfig}
          fontFamily={this.props.fontFamily ?? "Nunito Sans"}
          isLoading={this.props.isLoading}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          labelOrientation={this.props.labelOrientation}
          onDataPointClick={this.onDataPointClick}
          primaryColor={this.props.accentColor ?? Colors.ROYAL_BLUE_2}
          setAdaptiveYMin={this.props.setAdaptiveYMin}
          widgetId={this.props.widgetId}
          xAxisName={this.props.xAxisName}
          yAxisName={this.props.yAxisName}
        />
      </Suspense>
    );
  }

  static getWidgetType(): WidgetType {
    return "CHART_WIDGET";
  }
}
export interface ChartWidgetProps extends WidgetProps {
  chartType: ChartType;
  chartData: AllChartData;
  customFusionChartConfig: CustomFusionChartConfig;
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  isVisible?: boolean;
  allowScroll: boolean;
  borderRadius: string;
  boxShadow?: string;
  accentColor?: string;
  fontFamily?: string;
}

type ChartComponentPartialProps = Omit<ChartComponentProps, "onDataPointClick">;
export interface ChartWidgetProps
  extends WidgetProps,
    ChartComponentPartialProps {
  onDataPointClick?: string;
}

export default ChartWidget;
