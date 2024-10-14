import React, { lazy, Suspense } from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { contentConfig, styleConfig } from "./propertyConfig";
import {
  DefaultEChartConfig,
  DefaultEChartsBasicChartsData,
  DefaultFusionChartConfig,
  messages,
} from "../constants";
import type { ChartSelectedDataPoint } from "../constants";
import type { ChartComponentProps } from "../component";
import { Colors } from "constants/Colors";
import type { Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetCallout,
} from "WidgetProvider/constants";
import { ChartErrorComponent } from "../component/ChartErrorComponent";
import { syntaxErrorsFromProps } from "./SyntaxErrorsEvaluation";
import { EmptyChartData } from "../component/EmptyChartData";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { generateReactKey } from "widgets/WidgetUtils";
import { LabelOrientation } from "../constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { EChartsDatasetBuilder } from "../component/EChartsDatasetBuilder";

const ChartComponent = lazy(async () =>
  retryPromise(
    async () => import(/* webpackChunkName: "charts" */ "../component"),
  ),
);

export const emptyChartData = (props: ChartWidgetProps) => {
  if (props.chartType == "CUSTOM_FUSION_CHART") {
    return Object.keys(props.customFusionChartConfig).length == 0;
  } else if (props.chartType == "CUSTOM_ECHART") {
    return Object.keys(props.customEChartConfig).length == 0;
  } else {
    const builder = new EChartsDatasetBuilder(props.chartType, props.chartData);

    for (const seriesID in builder.filteredChartData) {
      if (Object.keys(props.chartData[seriesID].data).length > 0) {
        return false;
      }
    }

    return true;
  }
};

class ChartWidget extends BaseWidget<ChartWidgetProps, WidgetState> {
  static type = "CHART_WIDGET";
  static fontFamily: string = "Nunito Sans";

  static getConfig() {
    return {
      name: "Chart",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      needsErrorInfo: true,
      searchTags: ["graph", "visuals", "visualisations"],
    };
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      customEChartConfig: ["chartType"],
    };
  }

  static getDefaults() {
    return {
      rows: 32,
      columns: 24,
      widgetName: "Chart",
      chartType: "COLUMN_CHART",
      chartName: "Sales Report",
      allowScroll: false,
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      showDataPointLabel: false,
      customEChartConfig: `{{\n${JSON.stringify(
        DefaultEChartConfig,
        null,
        2,
      )}\n}}`,
      chartData: {
        [generateReactKey()]: DefaultEChartsBasicChartsData,
      },
      xAxisName: "Product Line",
      yAxisName: "Revenue($)",
      labelOrientation: LabelOrientation.AUTO,
      customFusionChartConfig: DefaultFusionChartConfig,

      /**
       * TODO, @sbalaji92
       * need to remove this once widget properties get added to dynamic binding path list
       * in WidgetAdditionSagas/dynamicBindingPathList function
       * */
      dynamicBindingPathList: [{ key: "customEChartConfig" }],
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getMethods() {
    return {
      getEditorCallouts(props: WidgetProps): WidgetCallout[] {
        const callouts: WidgetCallout[] = [];

        if (props.chartType == "CUSTOM_FUSION_CHART") {
          callouts.push({
            message: messages.customFusionChartDeprecationMessage,
            links: [
              {
                text: "Learn more",
                url: "https://www.appsmith.com/blog/deprecating-fusion-charts",
              },
            ],
          });
        }

        return callouts;
      },
    };
  }

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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig();
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

  getWidgetView() {
    const errors = syntaxErrorsFromProps(this.props);

    if (this.props.isLoading) {
      return this.renderChartWithData();
    }

    if (errors.length > 0) {
      return <ChartErrorComponent error={errors[0]} />;
    }

    if (emptyChartData(this.props)) {
      return <EmptyChartData />;
    }

    return this.renderChartWithData();
  }

  renderChartWithData() {
    return (
      <Suspense fallback={<Skeleton />}>
        <ChartComponent
          allowScroll={this.props.allowScroll}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          chartData={this.props.chartData}
          chartName={this.props.chartName}
          chartType={this.props.chartType}
          customEChartConfig={this.props.customEChartConfig}
          customFusionChartConfig={this.props.customFusionChartConfig}
          dimensions={this.props}
          fontFamily={ChartWidget.fontFamily}
          hasOnDataPointClick={Boolean(this.props.onDataPointClick)}
          isLoading={this.props.isLoading}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          labelOrientation={this.props.labelOrientation}
          onDataPointClick={this.onDataPointClick}
          primaryColor={this.props.accentColor ?? Colors.ROYAL_BLUE_2}
          setAdaptiveYMin={this.props.setAdaptiveYMin}
          showDataPointLabel={this.props.showDataPointLabel}
          widgetId={this.props.widgetId}
          xAxisName={this.props.xAxisName}
          yAxisName={this.props.yAxisName}
        />
      </Suspense>
    );
  }
}

type ChartComponentPartialProps = Omit<ChartComponentProps, "onDataPointClick">;
export interface ChartWidgetProps
  extends WidgetProps,
    ChartComponentPartialProps {
  onDataPointClick?: string;
}

export default ChartWidget;
