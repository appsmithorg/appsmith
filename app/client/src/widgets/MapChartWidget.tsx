import React, { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import withMeta, { WithMeta } from "./MetaHOC";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { CUSTOM_MAP_TYPES } from "constants/CustomMapConstants ";

export interface MapChartWidgetProps extends WidgetProps, WithMeta {
  isVisible: boolean;
}

const MapChartComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackPrefetch: true, webpackChunkName: "charts" */ "components/designSystems/appsmith/MapChartComponent"
    ),
  ),
);

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
                value: "maps/world",
              },
              {
                label: "World with Antarctica",
                value: "maps/worldwithantarctica",
              },
              {
                label: "Europe",
                value: "maps/europe",
              },
              {
                label: "North America",
                value: "maps/northamerica",
              },
              {
                label: "South America",
                value: "maps/southamerica",
              },
              {
                label: "Asia",
                value: "maps/asia",
              },
              {
                label: "Oceania",
                value: "maps/oceania",
              },
              {
                label: "Africa",
                value: "maps/africa",
              },
              {
                label: "Custom",
                value: "maps/custom",
              },
            ],
            isJSconvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "maps/world",
                  "maps/worldwithantarctica",
                  "maps/europe",
                  "maps/northamerica",
                  "maps/southamerica",
                  "maps/asia",
                  "maps/oceania",
                  "maps/africa",
                  "maps/custom",
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
        sectionName: "Map Data",
        children: [
          {
            helpText:
              "Manually configure a FusionMaps, see https://docs.appsmith.com/widget-reference/map#custom-map",
            placeholderText: `Enter {"type": "maps/world","dataSource": {}}`,
            propertyName: "customFusionMapConfig",
            label: "Custom Fusion Map Configuration",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
              params: {
                allowedKeys: [
                  {
                    type: ValidationTypes.TEXT,
                    name: "type",
                    params: {
                      allowedValues: CUSTOM_MAP_TYPES,
                      default: "",
                      required: true,
                    },
                  },
                  {
                    type: ValidationTypes.OBJECT,
                    name: "dataSource",
                    params: {
                      allowedKeys: [
                        {
                          name: "chart",
                          type: ValidationTypes.OBJECT,
                          params: {
                            default: {},
                          },
                        },
                        {
                          name: "data",
                          type: ValidationTypes.ARRAY,
                          params: {
                            default: [],
                            children: {
                              type: ValidationTypes.OBJECT,
                              params: {
                                allowedKeys: [
                                  {
                                    name: "id",
                                    type: ValidationTypes.TEXT,
                                  },
                                  {
                                    name: "value",
                                    type: ValidationTypes.NUMBER,
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            hidden: (props: MapChartWidgetProps) =>
              props.mapType !== "maps/custom",
            dependencies: ["mapType"],
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Populates the map with the data",
            propertyName: "data",
            label: "Data",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            hidden: (props: MapChartWidgetProps) =>
              props.mapType === "maps/custom",
            dependencies: ["mapType"],
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "id",
                        type: ValidationTypes.TEXT,
                        params: {
                          required: true,
                          default: "",
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.NUMBER,
                        params: {
                          required: true,
                          default: 10,
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
            helpText: "Triggers an action  the map type is changed to custom",
            propertyName: "onCustomMapSelected",
            label: "onCustomMapSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
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

  getPageView() {
    const { isVisible } = this.props;

    return (
      <Suspense fallback={<Skeleton />}>
        <MapChartComponent isVisible={isVisible} />
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.MAP_CHART_WIDGET;
  }
}

export default MapChartWidget;
export const ProfiledMapChartWidget = Sentry.withProfiler(
  withMeta(MapChartWidget),
);
