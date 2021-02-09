import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/ActionConstants";

const ChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "components/designSystems/appsmith/ChartComponent"
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
    };
  }
  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onDataPointClick: true,
    };
  }

  onDataPointClick() {
    if (this.props.onDataPointClick) {
      super.executeAction({
        dynamicString: this.props.onDataPointClick,
        event: {
          type: EventType.ON_DATA_POINT_CLICK,
        },
      });
    }
  }

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
          widgetId={this.props.widgetId}
          onDataPointClick={this.onDataPointClick}
          allowHorizontalScroll={this.props.allowHorizontalScroll}
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
  | "SCATTER_CHART";

export interface ChartDataPoint {
  x: any;
  y: any;
}

export interface ChartData {
  seriesName?: string;
  data: ChartDataPoint[];
}

export interface ChartWidgetProps extends WidgetProps {
  chartType: ChartType;
  chartData: ChartData[];
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
  onDataPointClick?: string;
}

export default ChartWidget;
export const ProfiledChartWidget = Sentry.withProfiler(ChartWidget);
