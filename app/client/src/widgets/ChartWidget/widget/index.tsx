import React, { lazy, Suspense } from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import propertyConfig from "./propertyConfig";
import {
  ChartType,
  CustomFusionChartConfig,
  AllChartData,
  ChartSelectedDataPoint,
} from "../constants";

import { WidgetType } from "constants/WidgetConstants";
import { ChartComponentProps } from "../component";
import { AppState } from "reducers";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { connect } from "react-redux";

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
          canvasPadding={this.props.canvasPadding}
          captionAlignment={this.props.captionAlignment}
          captionFontColor={this.props.captionFontColor}
          captionFontSize={this.props.captionFontSize}
          captionPadding={this.props.captionPadding}
          chartData={this.props.chartData}
          chartName={this.props.chartName}
          chartType={this.props.chartType}
          customFusionChartConfig={this.props.customFusionChartConfig}
          fontFamily={this.props.selectedTheme.properties.fontFamily.appFont}
          isLoading={this.props.isLoading}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          labelOrientation={this.props.labelOrientation}
          onDataPointClick={this.onDataPointClick}
          primaryColor={this.props.selectedTheme.properties.colors.primaryColor}
          setAdaptiveYMin={this.props.setAdaptiveYMin}
          widgetId={this.props.widgetId}
          xAxisName={this.props.xAxisName}
          xAxisNameColor={this.props.xAxisNameColor}
          xAxisNameFontSize={this.props.xAxisNameFontSize}
          xAxisValueColor={this.props.xAxisValueColor}
          yAxisName={this.props.yAxisName}
          yAxisNameColor={this.props.yAxisNameColor}
          yAxisNameFontSize={this.props.yAxisNameFontSize}
          yAxisValueColor={this.props.yAxisValueColor}
        />
      </Suspense>
    );
  }

  static getWidgetType(): WidgetType {
    return "CHART_WIDGET";
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    selectedTheme: getSelectedAppTheme(state),
  };
};
export interface ChartWidgetProps extends WidgetProps {
  captionPadding?: string;
  captionFontSize?: string;
  captionFontColor?: string;
  captionAlignment?: string;
  canvasPadding?: string;

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
  primaryColor?: string;
  fontFamily?: string;
  xAxisNameFontSize?: string;
  yAxisNameFontSize?: string;
  xAxisNameColor?: string;
  yAxisNameColor?: string;
  xAxisValueColor?: string;
  yAxisValueColor?: string;
}

type ChartComponentPartialProps = Omit<ChartComponentProps, "onDataPointClick">;
export interface ChartWidgetProps
  extends WidgetProps,
    ChartComponentPartialProps {
  onDataPointClick?: string;
}

export default connect(mapStateToProps, {})(ChartWidget as any);
