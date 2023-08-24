import React, { lazy, Suspense } from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { contentConfig, styleConfig } from "./propertyConfig";
import type { ChartSelectedDataPoint } from "../constants";

import type { WidgetType } from "constants/WidgetConstants";
import type { ChartComponentProps } from "../component";
import { Colors } from "constants/Colors";
import type { Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "widgets/constants";
import { ChartErrorComponent } from "../component/ChartErrorComponent";
import { syntaxErrorsFromProps } from "./SyntaxErrorsEvaluation";
import { EmptyChartData } from "../component/EmptyChartData";
import * as Sentry from "@sentry/react";

const ChartComponent = lazy(() =>
  retryPromise(() => import(/* webpackChunkName: "charts" */ "../component")),
);

export const isChartDataValid = (props: ChartWidgetProps): boolean => {
  switch (props.chartType) {
    case "CUSTOM_FUSION_CHART": {
      return !!props.customFusionChartConfig;
    }
    default: {
      for (const seriesID in props.chartData) {
        const seriesData = props.chartData[seriesID];

        if (!seriesData) {
          return false;
        }
        if (!seriesData.data) {
          return false;
        }
      }
      return true;
    }
  }
};

export const emptyChartData = (props: ChartWidgetProps) => {
  if (props.chartType == "CUSTOM_FUSION_CHART") {
    if (!props.customFusionChartConfig) {
      return true;
    } else {
      return Object.keys(props.customFusionChartConfig).length == 0;
    }
  } else {
    for (const seriesID in props.chartData) {
      if (props.chartData[seriesID].data?.length > 0) {
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
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    };
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

  sendSentryErrorMessage(props: ChartWidgetProps) {
    try {
      const errorProps = {
        chartData: props.chartData,
        customFusionChartConfig: props.customFusionChartConfig,
        chartType: props.chartType,
      };

      const message = `Getting undefined/null chart data ${JSON.stringify(
        errorProps,
      )}`;
      Sentry.captureMessage(message, Sentry.Severity.Error);
    } catch (error) {
      const message =
        "Error in capturing sentry error " + (error as Error).message;
      Sentry.captureMessage(message, Sentry.Severity.Error);
    }
  }

  getPageView() {
    const errors = syntaxErrorsFromProps(this.props);

    if (errors.length == 0) {
      const validData = isChartDataValid(this.props);

      if (!validData) {
        this.sendSentryErrorMessage(this.props);
      }

      if (!validData || emptyChartData(this.props)) {
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
