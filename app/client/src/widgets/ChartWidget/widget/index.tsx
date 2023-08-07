import React, { lazy, Suspense } from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { contentConfig, styleConfig } from "./propertyConfig";
import type { ChartSelectedDataPoint } from "../constants";
import type { ChartComponentProps } from "../component";
import { Colors } from "constants/Colors";
import type { Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import { ChartErrorComponent } from "../component/ChartErrorComponent";
import { syntaxErrorsFromProps } from "./SyntaxErrorsEvaluation";
import { EmptyChartData } from "../component/EmptyChartData";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import { generateReactKey } from "widgets/WidgetUtils";
import { LabelOrientation } from "../constants";
import IconSVG from "../icon.svg";

import { WIDGET_TAGS } from "constants/WidgetConstants";

const ChartComponent = lazy(() =>
  retryPromise(() => import(/* webpackChunkName: "charts" */ "../component")),
);

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
  static type = "CHART_WIDGET";

  static getConfig() {
    return {
      name: "Chart",
      iconSVG: IconSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      searchTags: ["graph", "visuals", "visualisations"],
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
      minWidth: FILL_WIDGET_MIN_WIDTH,
      showDataPointLabel: false,
      chartData: {
        [generateReactKey()]: {
          seriesName: "2023",
          data: [
            {
              x: "Product1",
              y: 20000,
            },
            {
              x: "Product2",
              y: 22000,
            },
            {
              x: "Product3",
              y: 32000,
            },
          ],
        },
      },
      xAxisName: "Product Line",
      yAxisName: "Revenue($)",
      labelOrientation: LabelOrientation.AUTO,
      customFusionChartConfig: {
        type: "column2d",
        dataSource: {
          data: [
            {
              label: "Product1",
              value: 20000,
            },
            {
              label: "Product2",
              value: 22000,
            },
            {
              label: "Product3",
              value: 32000,
            },
          ],
          chart: {
            caption: "Sales Report",
            xAxisName: "Product Line",
            yAxisName: "Revenue($)",
            theme: "fusion",
            alignCaptionWithCanvas: 1,
            // Caption styling =======================
            captionFontSize: "24",
            captionAlignment: "center",
            captionPadding: "20",
            captionFontColor: Colors.THUNDER,
            // legend position styling ==========
            legendIconSides: "4",
            legendIconBgAlpha: "100",
            legendIconAlpha: "100",
            legendPosition: "top",
            // Canvas styles ========
            canvasPadding: "0",
            // Chart styling =======
            chartLeftMargin: "20",
            chartTopMargin: "10",
            chartRightMargin: "40",
            chartBottomMargin: "10",
            // Axis name styling ======
            xAxisNameFontSize: "14",
            labelFontSize: "12",
            labelFontColor: Colors.DOVE_GRAY2,
            xAxisNameFontColor: Colors.DOVE_GRAY2,

            yAxisNameFontSize: "14",
            yAxisValueFontSize: "12",
            yAxisValueFontColor: Colors.DOVE_GRAY2,
            yAxisNameFontColor: Colors.DOVE_GRAY2,
          },
        },
      },
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
}

type ChartComponentPartialProps = Omit<ChartComponentProps, "onDataPointClick">;
export interface ChartWidgetProps
  extends WidgetProps,
    ChartComponentPartialProps {
  onDataPointClick?: string;
}

export default ChartWidget;
