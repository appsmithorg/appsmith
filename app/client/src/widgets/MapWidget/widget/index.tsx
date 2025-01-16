import { DEFAULT_CENTER } from "constants/WidgetConstants";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import MapComponent from "../component";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import styled from "styled-components";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { MarkerProps } from "../constants";
import { getBorderCSSShorthand } from "constants/DefaultTheme";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type {
  SnipingModeProperty,
  PropertyUpdates,
} from "WidgetProvider/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

const DisabledContainer = styled.div<{
  borderRadius: string;
  boxShadow?: string;
}>`
  background-color: white;
  height: 100%;
  width: 100%;
  overflow: scroll;
  text-align: center;
  display: flex;
  flex-direction: column;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow} !important;
  border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
  h1 {
    margin-top: 15%;
    margin-bottom: 10%;
    color: #7c7c7c;
  }
  p {
    color: #0a0b0e;
  }
`;

const DefaultCenter = { ...DEFAULT_CENTER, long: DEFAULT_CENTER.lng };

interface Center {
  lat: number;
  long: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

class MapWidget extends BaseWidget<MapWidgetProps, WidgetState> {
  static defaultProps = {};

  static type = "MAP_WIDGET";

  static getConfig() {
    return {
      name: "Map",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.CONTENT],
      needsMeta: true,
    };
  }

  static getDefaults() {
    return {
      rows: 40,
      columns: 24,
      isDisabled: false,
      isVisible: true,
      widgetName: "Map",
      enableSearch: true,
      zoomLevel: 50,
      enablePickLocation: true,
      allowZoom: true,
      mapCenter: { lat: 40.7128, long: -74.006 },
      defaultMarkers: [{ lat: 40.7128, long: -74.006, title: "New York" }],
      isClickedMarkerCentered: true,
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
      enableMapTypeControl: false,
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "defaultMarkers",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
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
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      center: {
        lat: "number",
        long: "number",
        title: "string",
      },
      markers: "[$__mapMarker__$]",
      selectedMarker: {
        lat: "number",
        long: "number",
        title: "string",
        description: "string",
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
            propertyName: "mapCenter",
            label: "Initial location",
            helpText:
              "Default location for the map. Search for a location directly in the field.",
            isJSConvertible: true,
            controlType: "LOCATION_SEARCH",
            dependencies: ["googleMapsApiKey"],
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
              params: {
                allowedKeys: [
                  {
                    name: "lat",
                    type: ValidationTypes.NUMBER,
                    params: {
                      min: -90,
                      max: 90,
                      default: 0,
                      required: true,
                    },
                  },
                  {
                    name: "long",
                    type: ValidationTypes.NUMBER,
                    params: {
                      min: -180,
                      max: 180,
                      default: 0,
                      required: true,
                    },
                  },
                ],
              },
            },
          },
          {
            propertyName: "defaultMarkers",
            label: "Default markers",
            controlType: "INPUT_TEXT",
            inputType: "ARRAY",
            helpText: "Sets the default markers on the map",
            placeholderText: '[{ "lat": "val1", "long": "val2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "lat",
                        type: ValidationTypes.NUMBER,
                        params: {
                          min: -90,
                          max: 90,
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "long",
                        type: ValidationTypes.NUMBER,
                        params: {
                          min: -180,
                          max: 180,
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "title",
                        type: ValidationTypes.TEXT,
                      },
                      {
                        name: "color",
                        type: ValidationTypes.TEXT,
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
            propertyName: "zoomLevel",
            label: "Zoom level",
            controlType: "STEP",
            helpText: "Changes the default zoom of the map",
            stepType: "ZOOM_PERCENTAGE",
            isBindProperty: false,
            isTriggerProperty: false,
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
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "enablePickLocation",
            label: "Enable pick location",
            helpText: "Allows a user to pick their location",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isClickedMarkerCentered",
            label: "Map & marker centering",
            helpText:
              "Controls whether the clicked marker is centered on the map",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "allowClustering",
            label: "Enable clustering",
            controlType: "SWITCH",
            helpText: "Allows markers to be clustered",
            defaultValue: false,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "enableSearch",
            label: "Enable search location",
            helpText: "Allows a user to search for a location",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "enableMapTypeControl",
            label: "Enable map types",
            controlType: "SWITCH",
            helpText: "Allows users to change the map type",
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Create marker",
        children: [
          {
            propertyName: "enableCreateMarker",
            label: "Create new marker",
            helpText: "Allows users to mark locations on the map",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "onCreateMarker",
            label: "onCreateMarker",
            helpText:
              "When create new marker is enabled, this event triggers upon successful marker creation",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            hidden: (props: MapWidgetProps) => {
              return !props.enableCreateMarker;
            },
            dependencies: ["enableCreateMarker"],
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            propertyName: "onMarkerClick",
            label: "onMarkerClick",
            helpText: "when the user clicks on the marker",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
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
  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      markers: "defaultMarkers",
      center: "mapCenter",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      center: undefined,
      markers: undefined,
      selectedMarker: undefined,
    };
  }
  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  updateCenter = (lat?: number, long?: number, title?: string) => {
    this.props.updateWidgetMetaProperty("center", { lat, long, title });
  };

  updateMarker = (lat: number, long: number, index: number) => {
    const markers: Array<MarkerProps> = [...(this.props.markers || [])].map(
      (marker, i) => {
        if (index === i) {
          marker = { lat, long };
        }

        return marker;
      },
    );

    this.disableDrag(false);
    this.props.updateWidgetMetaProperty("markers", markers);
  };

  onCreateMarker = (lat?: number, long?: number) => {
    this.disableDrag(true);
    const marker = { lat, long, title: "" };

    const markers = [];

    (this.props.markers || []).forEach((m) => {
      markers.push(m);
    });
    markers.push(marker);
    this.props.updateWidgetMetaProperty("markers", markers);
    this.props.updateWidgetMetaProperty("selectedMarker", marker, {
      triggerPropertyName: "onCreateMarker",
      dynamicString: this.props.onCreateMarker,
      event: {
        type: EventType.ON_CREATE_MARKER,
      },
    });
  };

  unselectMarker = () => {
    this.props.updateWidgetMetaProperty("selectedMarker", undefined);
  };

  onMarkerClick = (lat?: number, long?: number, title?: string) => {
    this.disableDrag(true);
    const selectedMarker = {
      lat: lat,
      long: long,
      title: title,
    };

    this.props.updateWidgetMetaProperty("selectedMarker", selectedMarker, {
      triggerPropertyName: "onMarkerClick",
      dynamicString: this.props.onMarkerClick,
      event: {
        type: EventType.ON_MARKER_CLICK,
      },
    });
  };

  getCenter(): Center {
    return this.props.center || this.props.mapCenter || DefaultCenter;
  }

  componentDidUpdate(prevProps: MapWidgetProps) {
    //remove selectedMarker when map initial location is updated
    if (
      JSON.stringify(prevProps.center) !== JSON.stringify(this.props.center) &&
      this.props.selectedMarker
    ) {
      this.unselectMarker();
    }

    // If initial location was changed
    if (
      JSON.stringify(prevProps.mapCenter) !==
      JSON.stringify(this.props.mapCenter)
    ) {
      this.props.updateWidgetMetaProperty("center", this.props.mapCenter);

      return;
    }

    // If markers were changed
    if (
      this.props.markers &&
      this.props.markers.length > 0 &&
      JSON.stringify(prevProps.markers) !== JSON.stringify(this.props.markers)
    ) {
      this.props.updateWidgetMetaProperty(
        "center",
        this.props.markers[this.props.markers.length - 1],
      );
    }
  }

  enableDrag = () => {
    this.disableDrag(false);
  };

  getWidgetView() {
    return (
      <>
        {!this.props.googleMapsApiKey && (
          <DisabledContainer
            borderRadius={this.props.borderRadius}
            boxShadow={this.props.boxShadow}
          >
            <h1>{"Map Widget disabled"}</h1>
            <mark>Key: x{this.props.googleMapsApiKey}x</mark>
            <p>{"Map widget requires a Google Maps API key"}</p>
            <p>
              {"See our"}
              <a
                href="https://docs.appsmith.com/getting-started/setup/instance-configuration/google-maps"
                rel="noopener noreferrer"
                target="_blank"
              >
                {" documentation "}
              </a>
              {"to configure API keys"}
            </p>
          </DisabledContainer>
        )}
        {this.props.googleMapsApiKey && (
          <MapComponent
            allowClustering={this.props.allowClustering}
            allowZoom={this.props.allowZoom}
            apiKey={this.props.googleMapsApiKey}
            borderRadius={this.props.borderRadius}
            boxShadow={this.props.boxShadow}
            center={this.getCenter()}
            clickedMarkerCentered={this.props.isClickedMarkerCentered}
            enableCreateMarker={this.props.enableCreateMarker}
            enableDrag={this.enableDrag}
            enableMapTypeControl={this.props.enableMapTypeControl}
            enablePickLocation={this.props.enablePickLocation}
            enableSearch={this.props.enableSearch}
            isDisabled={this.props.isDisabled}
            isVisible={this.props.isVisible}
            markers={this.props.markers}
            saveMarker={this.onCreateMarker}
            selectMarker={this.onMarkerClick}
            selectedMarker={this.props.selectedMarker}
            unselectMarker={this.unselectMarker}
            updateCenter={this.updateCenter}
            updateMarker={this.updateMarker}
            widgetId={this.props.widgetId}
            zoomLevel={this.props.zoomLevel}
          />
        )}
      </>
    );
  }
}

export interface MapWidgetProps extends WidgetProps {
  googleMapsApiKey?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  enableSearch: boolean;
  zoomLevel: number;
  allowZoom: boolean;
  enablePickLocation: boolean;
  mapCenter: {
    lat: number;
    long: number;
    title?: string;
  };
  center?: {
    lat: number;
    long: number;
  };
  defaultMarkers?: Array<MarkerProps>;
  markers?: Array<MarkerProps>;
  selectedMarker?: {
    lat: number;
    long: number;
    title?: string;
    color?: string;
  };
  onMarkerClick?: string;
  onCreateMarker?: string;
  borderRadius: string;
  boxShadow?: string;
  allowClustering?: boolean;
  enableMapTypeControl: boolean;
}

export default MapWidget;
