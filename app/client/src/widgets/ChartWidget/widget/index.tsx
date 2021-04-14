import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import propertyConfig from "./propertyConfig";
import {
  ChartData,
  ChartDataPoint,
  ChartType,
  CustomFusionChartConfig,
} from "../constants";

const ChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "../component"
    ),
  ),
);

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      xAxisName: VALIDATION_TYPES.TEXT,
      yAxisName: VALIDATION_TYPES.TEXT,
      chartName: VALIDATION_TYPES.TEXT,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      chartData: VALIDATION_TYPES.CHART_DATA,
      customFusionChartConfig: VALIDATION_TYPES.CUSTOM_FUSION_CHARTS_DATA,
    };
  }

  static getMetaPropertiesMap(): Record<string, undefined> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getPropertyPaneConfig() {
    return propertyConfig;
  }

  onDataPointClick = (selectedDataPoint: { x: any; y: any }) => {
    this.props.updateWidgetMetaProperty(
      "selectedDataPoint",
      selectedDataPoint,
      {
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
          key={this.props.widgetId}
          isVisible={this.props.isVisible}
          chartType={this.props.chartType}
          xAxisName={this.props.xAxisName}
          yAxisName={this.props.yAxisName}
          chartName={this.props.chartName}
          chartData={this.props.chartData}
          customFusionChartConfig={this.props.customFusionChartConfig}
          widgetId={this.props.widgetId}
          onDataPointClick={this.onDataPointClick}
          allowHorizontalScroll={this.props.allowHorizontalScroll}
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
  chartData: ChartData[];
  customFusionChartConfig: { config: CustomFusionChartConfig };
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
  onDataPointClick?: string;
  selectedDataPoint?: ChartDataPoint;
}

export default ChartWidget;
