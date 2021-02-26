import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/ActionConstants";
import withMeta, { WithMeta } from "./MetaHOC";

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

  static getMetaPropertiesMap(): Record<string, undefined> {
    return {
      selectedDataPoint: undefined,
    };
  }

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
            isBindProperty: true,
            isTriggerProperty: false,
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
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          // {
          //   helpText: "Populates the chart with the data",
          //   propertyName: "chartData",
          //   placeholderText: 'Enter [{ "x": "val", "y": "val" }]',
          //   label: "Chart Data",
          //   controlType: "CONTROL_GROUP_LIST",
          //   hidden: (props: ChartWidgetProps) =>
          //     props && props.chartType === "PIE_CHART",
          //   children: [
          //     {
          //       helpText: "Series Name",
          //       propertyName: "seriesName",
          //       label: "Series Name",
          //       controlType: "INPUT_TEXT",
          //     },
          //     {
          //       helpText: "Series data",
          //       propertyName: "data",
          //       label: "Series Data",
          //       controlType: "INPUT_TEXT_AREA",
          //     },
          //   ],
          // },
          {
            helpText: "Populates the chart with the data",
            propertyName: "chartData",
            placeholderText: 'Enter [{ "x": "val", "y": "val" }]',
            label: "Chart Data",
            controlType: "CHART_DATA",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Specifies the label of the x-axis",
            propertyName: "xAxisName",
            placeholderText: "Enter label text",
            label: "x-axis Label",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Specifies the label of the y-axis",
            propertyName: "yAxisName",
            placeholderText: "Enter label text",
            label: "y-axis Label",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Enables scrolling inside the chart",
            propertyName: "allowHorizontalScroll",
            label: "Allow horizontal scroll",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the chart data point is clicked",
            propertyName: "onDataPointClick",
            label: "onDataPointClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
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

export interface ChartWidgetProps extends WidgetProps, WithMeta {
  chartType: ChartType;
  chartData: ChartData[];
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
