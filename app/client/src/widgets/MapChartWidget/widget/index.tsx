import React, { lazy, Suspense } from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import {
  dataSetForAfrica,
  dataSetForAsia,
  dataSetForEurope,
  dataSetForNorthAmerica,
  dataSetForOceania,
  dataSetForSouthAmerica,
  dataSetForWorld,
  dataSetForWorldWithAntarctica,
  MapColorObject,
  MapTypes,
} from "../constants";
import { MapType } from "../component";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

const MapChartComponent = lazy(() =>
  retryPromise(() =>
    import(/* webpackChunkName: "mapCharts" */ "../component"),
  ),
);

const dataSetMapping: Record<MapType, any> = {
  [MapTypes.WORLD]: dataSetForWorld,
  [MapTypes.WORLD_WITH_ANTARCTICA]: dataSetForWorldWithAntarctica,
  [MapTypes.EUROPE]: dataSetForEurope,
  [MapTypes.NORTH_AMERICA]: dataSetForNorthAmerica,
  [MapTypes.SOURTH_AMERICA]: dataSetForSouthAmerica,
  [MapTypes.ASIA]: dataSetForAsia,
  [MapTypes.OCEANIA]: dataSetForOceania,
  [MapTypes.AFRICA]: dataSetForAfrica,
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
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
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
                ],
              },
            },
          },
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
        ],
      },
      {
        sectionName: "Map Chart Data",
        children: [
          {
            helpText: "Populates the map with the data",
            propertyName: "data",
            label: "Data",
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
        sectionName: "Styles",
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
        sectionName: "Actions",
        children: [
          {
            helpText:
              "Triggers an action when the map chart data point is clicked",
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

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDataPoint: undefined,
    };
  }

  static getWidgetType(): WidgetType {
    return "MAP_CHART_WIDGET";
  }

  handleDataPointClick = (evt: any) => {
    const { onDataPointClick } = this.props;

    this.props.updateWidgetMetaProperty("selectedDataPoint", evt.data, {
      triggerPropertyName: "onDataPointClick",
      dynamicString: onDataPointClick,
      event: {
        type: EventType.ON_DATA_POINT_CLICK,
      },
    });
  };

  getPageView() {
    const {
      colorRange,
      data,
      isVisible,
      mapTitle,
      mapType,
      showLabels,
    } = this.props;

    return (
      <Suspense fallback={<Skeleton />}>
        <MapChartComponent
          caption={mapTitle}
          colorRange={colorRange}
          data={data}
          isVisible={isVisible}
          onDataPointClick={this.handleDataPointClick}
          showLabels={showLabels}
          type={mapType}
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
}

export default MapChartWidget;
