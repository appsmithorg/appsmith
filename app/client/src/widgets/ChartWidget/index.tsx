import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import withMeta, { WithMeta } from "widgets/MetaHOC";
import propertyConfig from "widgets/ChartWidget/propertyConfig";
import { CustomFusionChartConfig } from "components/designSystems/appsmith/ChartComponent";

const ChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "components/designSystems/appsmith/ChartComponent"
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

  onDataPointClick = (selectedDataPoint: { x: any; y: any }) => {
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
          allowHorizontalScroll={this.props.allowHorizontalScroll}
          chartData={this.props.chartData}
          chartName={this.props.chartName}
          chartType={this.props.chartType}
          customFusionChartConfig={this.props.customFusionChartConfig}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          onDataPointClick={this.onDataPointClick}
          setAdaptiveYMin={this.props.setAdaptiveYMin}
          widgetId={this.props.widgetId}
          xAxisName={this.props.xAxisName}
          yAxisName={this.props.yAxisName}
        />
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return "CHART_WIDGET";
  }
}

export type ChartType =
  | "LINE_CHART"
  | "BAR_CHART"
  | "PIE_CHART"
  | "COLUMN_CHART"
  | "AREA_CHART"
  | "SCATTER_CHART"
  | "CUSTOM_FUSION_CHART";

export interface ChartDataPoint {
  x: any;
  y: any;
}

export interface AllChartData {
  [key: string]: ChartData;
}
export interface ChartData {
  seriesName?: string;
  data: ChartDataPoint[];
}

export interface ChartWidgetProps extends WidgetProps, WithMeta {
  chartType: ChartType;
  chartData: AllChartData;
  customFusionChartConfig: CustomFusionChartConfig;
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
  onDataPointClick?: string;
  selectedDataPoint?: ChartDataPoint;
}

export default ChartWidget;
export const ProfiledChartWidget = Sentry.withProfiler(withMeta(ChartWidget));
