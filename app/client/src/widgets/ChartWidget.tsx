import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";

const ChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "components/designSystems/appsmith/ChartComponent"
    ),
  ),
);

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Adds a title to the chart",
            placeholderText: "Enter title",
            propertyName: "chartName",
            label: "Title",
            controlType: "INPUT_TEXT",
          },
          {
            helpText: "Changes the visualisation of the chart data",
            propertyName: "chartType",
            label: "Chart Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Line Chart",
                value: "LINE_CHART",
              },
              {
                label: "Bar Chart",
                value: "BAR_CHART",
              },
              {
                label: "Pie Chart",
                value: "PIE_CHART",
              },
              {
                label: "Column Chart",
                value: "COLUMN_CHART",
              },
              {
                label: "Area Chart",
                value: "AREA_CHART",
              },
              {
                label: "Custom FusionChart",
                value: "CUSTOM_FUSION_CHART",
              },
            ],
            isJSConvertible: true,
          },
          {
            helpText: "Populates the chart with the data",
            propertyName: "chartData",
            placeholderText: 'Enter [{ "x": "val", "y": "val" }]',
            label: "Chart Data",
            controlType: "CHART_DATA",
            hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
          },
          {
            helpText: "Manually configure a FusionChart, see fusioncharts.com",
            propertyName: "customFusionChartConfig",
            placeholderText: `Enter {type: "bar2d","dataSource": {}}`,
            label: "Custom Fusion Chart Configuration",
            controlType: "CUSTOM_FUSION_CHARTS_DATA",
            hidden: (x: any) => x.chartType !== "CUSTOM_FUSION_CHART",
          },
          {
            helpText: "Specifies the label of the x-axis",
            propertyName: "xAxisName",
            placeholderText: "Enter label text",
            label: "x-axis Label",
            controlType: "INPUT_TEXT",
            hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
          },
          {
            helpText: "Specifies the label of the y-axis",
            propertyName: "yAxisName",
            placeholderText: "Enter label text",
            label: "y-axis Label",
            controlType: "INPUT_TEXT",
            hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
          },
          {
            helpText: "Enables scrolling inside the chart",
            propertyName: "allowHorizontalScroll",
            label: "Allow horizontal scroll",
            controlType: "SWITCH",
            hidden: (x: any) => x.chartType === "CUSTOM_FUSION_CHART",
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
          },
        ],
      },
    ];
  }
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
  | "SCATTER_CHART"
  | "CUSTOM_FUSION_CHART";

export interface ChartDataPoint {
  x: any;
  y: any;
}

export interface ChartData {
  seriesName?: string;
  data: ChartDataPoint[];
}

export interface CustomFusionChartConfig {
  config: {
    type: string;
    dataSource?: any;
  };
}

export interface ChartWidgetProps extends WidgetProps {
  chartType: ChartType;
  chartData: ChartData[];
  customFusionChartConfig: CustomFusionChartConfig;
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  isVisible?: boolean;
  allowHorizontalScroll: boolean;
}

export default ChartWidget;
export const ProfiledChartWidget = Sentry.withProfiler(ChartWidget);
