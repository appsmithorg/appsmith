import React, { lazy, Suspense } from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { contentConfig, styleConfig } from "./propertyConfig";
import {
  CUSTOM_ECHART_FEATURE_FLAG,
  FUSION_CHART_DEPRECATION_FLAG,
  messages,
  type ChartSelectedDataPoint,
} from "../constants";
import type { WidgetType } from "constants/WidgetConstants";
import type { ChartComponentProps } from "../component";
import { Colors } from "constants/Colors";
import type { Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AutocompletionDefinitions,
  WidgetCallout,
} from "widgets/constants";
import { ChartErrorComponent } from "../component/ChartErrorComponent";
import { syntaxErrorsFromProps } from "./SyntaxErrorsEvaluation";
import { EmptyChartData } from "../component/EmptyChartData";
import type { ChartType } from "../constants";
import { EChartsDatasetBuilder } from "../component/EChartsDatasetBuilder";

const ChartComponent = lazy(() =>
  retryPromise(() => import(/* webpackChunkName: "charts" */ "../component")),
);

export const isBasicEChart = (type: ChartType) => {
  const types: ChartType[] = [
    "AREA_CHART",
    "PIE_CHART",
    "LINE_CHART",
    "BAR_CHART",
    "COLUMN_CHART",
  ];
  return types.includes(type);
};

export const emptyChartData = (props: ChartWidgetProps) => {
  if (props.chartType == "CUSTOM_FUSION_CHART") {
    return Object.keys(props.customFusionChartConfig).length == 0;
  } else if (props.chartType == "CUSTOM_ECHART") {
    return Object.keys(props.customEChartConfig).length == 0;
  } else {
    const seriesData = EChartsDatasetBuilder.chartData(
      props.chartType,
      props.chartData,
    );

    for (const seriesID in seriesData) {
      if (Object.keys(props.chartData[seriesID].data).length > 0) {
        return false;
      }
    }
    return true;
  }
};

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Chart widget is used to view the graphical representation of your data. Chart is the go-to widget for your data visualisation needs.",
      "!url": "https://docs.appsmith.com/widget-reference/chart",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      chartData: {
        seriesName: "string",
        data: "[$__chartDataPoint__$]",
      },
      xAxisName: "string",
      yAxisName: "string",
      selectedDataPoint: "$__chartDataPoint__$",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig(
      this.getFeatureFlag(CUSTOM_ECHART_FEATURE_FLAG),
      this.showCustomFusionChartDeprecationMessages(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static showCustomFusionChartDeprecationMessages() {
    return this.getFeatureFlag(FUSION_CHART_DEPRECATION_FLAG);
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    };
  }

  static editorCallouts(props: WidgetProps): WidgetCallout[] {
    const callouts: WidgetCallout[] = [];
    if (
      this.showCustomFusionChartDeprecationMessages() &&
      props.chartType == "CUSTOM_FUSION_CHART"
    ) {
      callouts.push({
        message: messages.customFusionChartDeprecationMessage,
        links: [
          {
            text: "Learn More",
            url: "https://docs.appsmith.com",
          },
        ],
      });
    }
    return callouts;
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
    const errors = syntaxErrorsFromProps(this.props);

    if (errors.length == 0) {
      if (emptyChartData(this.props)) {
        return <EmptyChartData />;
      } else {
        return (
          <Suspense fallback={<Skeleton />}>
            <ChartComponent
              allowScroll={this.props.allowScroll}
              borderRadius={this.props.borderRadius}
              bottomRow={this.props.bottomRow}
              boxShadow={this.props.boxShadow}
              chartData={this.props.chartData}
              chartName={this.props.chartName}
              chartType={this.props.chartType}
              customEChartConfig={this.props.customEChartConfig}
              customFusionChartConfig={this.props.customFusionChartConfig}
              dimensions={this.getComponentDimensions()}
              fontFamily={this.props.fontFamily ?? "Nunito Sans"}
              hasOnDataPointClick={Boolean(this.props.onDataPointClick)}
              isLoading={this.props.isLoading}
              isVisible={this.props.isVisible}
              key={this.props.widgetId}
              labelOrientation={this.props.labelOrientation}
              leftColumn={this.props.leftColumn}
              onDataPointClick={this.onDataPointClick}
              primaryColor={this.props.accentColor ?? Colors.ROYAL_BLUE_2}
              rightColumn={this.props.rightColumn}
              setAdaptiveYMin={this.props.setAdaptiveYMin}
              showDataPointLabel={this.props.showDataPointLabel}
              topRow={this.props.topRow}
              widgetId={this.props.widgetId}
              xAxisName={this.props.xAxisName}
              yAxisName={this.props.yAxisName}
            />
          </Suspense>
        );
      }
    } else {
      return <ChartErrorComponent error={errors[0]} />;
    }
  }

  static getWidgetType(): WidgetType {
    return "CHART_WIDGET";
  }
}

type ChartComponentPartialProps = Omit<ChartComponentProps, "onDataPointClick">;
export interface ChartWidgetProps
  extends WidgetProps,
    ChartComponentPartialProps {
  onDataPointClick?: string;
}

export default ChartWidget;
