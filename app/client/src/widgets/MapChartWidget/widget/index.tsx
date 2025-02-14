import React, { Suspense, lazy } from "react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import { retryPromise } from "utils/AppsmithUtils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { MapColorObject } from "../constants";
import {
  dataSetForAfrica,
  dataSetForAsia,
  dataSetForEurope,
  dataSetForNorthAmerica,
  dataSetForOceania,
  dataSetForSouthAmerica,
  dataSetForUSA,
  dataSetForWorld,
  dataSetForWorldWithAntarctica,
  MapTypes,
} from "../constants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  WidgetCallout,
} from "WidgetProvider/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import Skeleton from "components/utils/Skeleton";
import type { MapType } from "../component/types";

const MapChartComponent = lazy(async () =>
  retryPromise(
    async () => import(/* webpackChunkName: "mapCharts" */ "../component"),
  ),
);

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataSetMapping: Record<MapType, any> = {
  [MapTypes.WORLD]: dataSetForWorld,
  [MapTypes.WORLD_WITH_ANTARCTICA]: dataSetForWorldWithAntarctica,
  [MapTypes.EUROPE]: dataSetForEurope,
  [MapTypes.NORTH_AMERICA]: dataSetForNorthAmerica,
  [MapTypes.SOURTH_AMERICA]: dataSetForSouthAmerica,
  [MapTypes.ASIA]: dataSetForAsia,
  [MapTypes.OCEANIA]: dataSetForOceania,
  [MapTypes.AFRICA]: dataSetForAfrica,
  [MapTypes.USA]: dataSetForUSA,
};

// A hook to update the corresponding dataset when map type is changed
const updateDataSet = (
  props: MapChartWidgetProps,
  propertyPath: string,
  propertyValue: MapType,
) => {
  const propertiesToUpdate = [
    { propertyPath, propertyValue },
    {
      propertyPath: "data",
      propertyValue: dataSetMapping[propertyValue],
    },
  ];

  return propertiesToUpdate;
};

class MapChartWidget extends BaseWidget<MapChartWidgetProps, WidgetState> {
  static type = "MAP_CHART_WIDGET";

  static getConfig() {
    return {
      name: "Map Chart", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true, // Defines if this widget adds any meta properties
      isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
      searchTags: ["graph", "visuals", "visualisations"],
    };
  }

  static getDefaults() {
    return {
      rows: 32,
      columns: 24,
      widgetName: "MapChart",
      version: 1,
      mapType: MapTypes.WORLD,
      mapTitle: "Global Population",
      showLabels: true,
      data: dataSetForWorld,
      colorRange: [
        {
          minValue: 0.5,
          maxValue: 1.0,
          code: "#FFD74D",
        },
        {
          minValue: 1.0,
          maxValue: 2.0,
          code: "#FB8C00",
        },
        {
          minValue: 2.0,
          maxValue: 3.0,
          code: "#E65100",
        },
      ],
      responsiveBehavior: ResponsiveBehavior.Fill,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
      minWidth: FILL_WIDGET_MIN_WIDTH,
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Map Chart widget shows the graphical representation of your data on the map.",
      "!url": "https://docs.appsmith.com/widget-reference/map-chart",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      selectedDataPoint: {
        id: "string",
        label: "string",
        originalId: "string",
        shortLabel: "string",
        value: "number",
      },
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText: "Sets the map type",
            propertyName: "mapType",
            label: "Map Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "World",
                value: MapTypes.WORLD,
              },
              {
                label: "World with Antarctica",
                value: MapTypes.WORLD_WITH_ANTARCTICA,
              },
              {
                label: "Europe",
                value: MapTypes.EUROPE,
              },
              {
                label: "North America",
                value: MapTypes.NORTH_AMERICA,
              },
              {
                label: "South America",
                value: MapTypes.SOURTH_AMERICA,
              },
              {
                label: "Asia",
                value: MapTypes.ASIA,
              },
              {
                label: "Oceania",
                value: MapTypes.OCEANIA,
              },
              {
                label: "Africa",
                value: MapTypes.AFRICA,
              },
              {
                label: "USA",
                value: MapTypes.USA,
              },
            ],
            isJSconvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            updateHook: updateDataSet,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  MapTypes.WORLD,
                  MapTypes.WORLD_WITH_ANTARCTICA,
                  MapTypes.EUROPE,
                  MapTypes.NORTH_AMERICA,
                  MapTypes.SOURTH_AMERICA,
                  MapTypes.ASIA,
                  MapTypes.OCEANIA,
                  MapTypes.AFRICA,
                  MapTypes.USA,
                ],
              },
            },
          },
          {
            helpText: "Populates the map with the data",
            propertyName: "data",
            label: "Chart Data",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                unique: true,
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "id",
                        type: ValidationTypes.TEXT,
                        params: {
                          unique: true,
                          required: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          required: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            helpText: "Sets the map title",
            placeholderText: "Enter title",
            propertyName: "mapTitle",
            label: "Title",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "showLabels",
            label: "Show Labels",
            helpText: "Sets whether entity labels will be shown or hidden",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the map chart data point is clicked",
            propertyName: "onDataPointClick",
            label: "onDataPointClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            additionalAutoComplete: () => ({
              selectedDataPoint: {
                value: 1.1,
                label: "",
                shortLabel: "",
                originalId: "",
                id: "",
              },
            }),
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Defines ranges for categorizing entities on a map based on their data values.",
            propertyName: "colorRange",
            label: "Color Range",
            controlType: "INPUT_TEXT",
            placeholderText: "Color range object",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                unique: true,
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "minValue",
                        type: ValidationTypes.NUMBER,
                        params: {
                          required: true,
                        },
                      },
                      {
                        name: "maxValue",
                        type: ValidationTypes.NUMBER,
                        params: {
                          required: true,
                        },
                      },
                      {
                        name: "displayValue",
                        type: ValidationTypes.TEXT,
                      },
                      {
                        name: "code",
                        type: ValidationTypes.TEXT,
                        params: {
                          expected: {
                            type: "Hex color (6-digit)",
                            example: "#FF04D7",
                            autocompleteDataType: AutocompleteDataType.STRING,
                          },
                        },
                      },
                      {
                        name: "alpha",
                        type: ValidationTypes.NUMBER,
                        params: {
                          min: 0,
                          max: 100,
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    };
  }

  static getMethods() {
    return {
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message:
              "Map chart widget switched from using Fusion chart library to Echarts. Please verify that the chart is displaying properly",
          },
        ];
      },
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleDataPointClick = (data: any) => {
    const { onDataPointClick } = this.props;

    this.props.updateWidgetMetaProperty("selectedDataPoint", data, {
      triggerPropertyName: "onDataPointClick",
      dynamicString: onDataPointClick,
      event: {
        type: EventType.ON_DATA_POINT_CLICK,
      },
      globalContext: {
        selectedDataPoint: data,
      },
    });
  };

  getWidgetView() {
    const { colorRange, data, isVisible, mapTitle, mapType, showLabels } =
      this.props;

    return (
      <Suspense fallback={<Skeleton />}>
        <MapChartComponent
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          caption={mapTitle || ""}
          colorRange={colorRange}
          data={data}
          fontFamily={this.props.fontFamily ?? "Nunito Sans"}
          height={this.props.componentHeight}
          isVisible={isVisible}
          onDataPointClick={this.handleDataPointClick}
          showLabels={showLabels}
          type={mapType}
          width={this.props.componentWidth}
        />
      </Suspense>
    );
  }
}

export interface MapChartWidgetProps extends WidgetProps {
  mapTitle?: string;
  mapType: MapType;
  onDataPointClick?: string;
  showLabels: boolean;
  colorRange: MapColorObject[];
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
}

export default MapChartWidget;
