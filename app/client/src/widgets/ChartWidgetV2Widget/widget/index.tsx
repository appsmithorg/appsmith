import React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";

import ChartWidgetV2Component from "../component";
import { propertyPaneConfig, styleConfig } from "./propertyPaneConfig";

import type { ChartType, ChartSelectedDataPoint } from "../constants";
import type { AutocompletionDefinitions } from "widgets/constants";
import type { Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class ChartWidgetV2Widget extends BaseWidget<
  ChartWidgetV2WidgetProps,
  WidgetState
> {
  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Chart widget is used to view the graphical representation of your data. Chart is the go-to widget for your data visualisation needs.",
      "!url": "https://docs.appsmith.com/widget-reference/chart",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      selectedDataPoint: {
        data: "Record<string, unknown>",
        seriesName: "string",
      },
    };
  }
  static getPropertyPaneContentConfig() {
    return propertyPaneConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
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
    console.log(
      "***",
      "on data click for widget called",
      selectedDataPoint,
      this.props.onDataPointClick,
    );

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
      <ChartWidgetV2Component
        {...this.props}
        hasOnDataPointClick={Boolean(this.props.onDataPointClick)}
        onDataPointClick={this.onDataPointClick}
      />
    );
  }

  static getWidgetType(): string {
    return "CHARTWIDGETV2_WIDGET";
  }
}

export interface ChartWidgetV2WidgetProps extends WidgetProps {
  chartType: ChartType;
  chartData: any;
  chartConfig: any;
  customChartData: any;
  borderRadius: string;
  boxShadow: string;
  onDataPointClick?: string;
}

export default ChartWidgetV2Widget;
