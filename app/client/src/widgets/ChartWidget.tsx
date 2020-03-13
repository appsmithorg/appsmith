import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import ChartComponent from "components/designSystems/appsmith/ChartComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      chartData: VALIDATION_TYPES.CHART_DATA,
      xAxisName: VALIDATION_TYPES.TEXT,
      yAxisName: VALIDATION_TYPES.TEXT,
      chartName: VALIDATION_TYPES.TEXT,
    };
  }

  getPageView() {
    return (
      <ChartComponent
        key={this.props.widgetId}
        isVisible={this.props.isVisible}
        chartType={this.props.chartType}
        xAxisName={this.props.xAxisName}
        yAxisName={this.props.yAxisName}
        chartName={this.props.chartName}
        componentWidth={this.state.componentWidth - 10}
        componentHeight={this.state.componentHeight - 10}
        chartData={this.props.chartData}
      />
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

export interface ChartData {
  x: any;
  y: any;
}

export interface ChartWidgetProps extends WidgetProps {
  chartType: ChartType;
  chartData: ChartData[];
  xAxisName: string;
  yAxisName: string;
  chartName: string;
  componentWidth: number;
  componentHeight: number;
  isVisible?: boolean;
}

export default ChartWidget;
