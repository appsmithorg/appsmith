import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import MapComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import styled from "styled-components";
import { DEFAULT_CENTER } from "constants/WidgetConstants";
import { getBorderCSSShorthand } from "constants/DefaultTheme";
import { MarkerProps } from "../constants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

const { google } = getAppsmithConfigs();

const DisabledContainer = styled.div`
  background-color: white;
  height: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
  border-radius: 0;
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

type Center = {
  lat: number;
  long: number;
  [x: string]: any;
};
class MapWidget extends BaseWidget<MapWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "mapCenter",
            label: "Initial location",
            isJSConvertible: true,
            controlType: "LOCATION_SEARCH",
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
          {
            propertyName: "isClickedMarkerCentered",
            label: "Map & Marker centering",
            helpText:
              "Controls whether the clicked marker is centered on the map",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
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
            propertyName: "enablePickLocation",
            label: "Enable pick location",
            helpText: "Allows a user to pick their location",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "enableCreateMarker",
            label: "Create new marker",
            helpText: "Allows users to mark locations on the map",
            controlType: "SWITCH",
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
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "zoomLevel",
            label: "Zoom Level",
            controlType: "STEP",
            helpText: "Changes the default zoom of the map",
            stepType: "ZOOM_PERCENTAGE",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            propertyName: "onMarkerClick",
            label: "onMarkerClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            propertyName: "onCreateMarker",
            label: "onCreateMarker",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, any> {
    return {
      markers: "defaultMarkers",
      center: "mapCenter",
    };
  }

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

  updateCenter = (lat: number, long: number) => {
    this.props.updateWidgetMetaProperty("center", { lat, long });
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

  onCreateMarker = (lat: number, long: number) => {
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

  onMarkerClick = (lat: number, long: number, title: string) => {
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

  getPageView() {
    return (
      <>
        {!google.enabled && (
          <DisabledContainer>
            <h1>{"Map Widget disabled"}</h1>
            <p>{"Map widget requires a Google Maps API Key"}</p>
            <p>
              {"See our"}
              <a
                href="https://docs.appsmith.com/v/v1.2.1/setup/docker/google-maps"
                rel="noopener noreferrer"
                target="_blank"
              >
                {" documentation "}
              </a>
              {"to configure API Keys"}
            </p>
          </DisabledContainer>
        )}
        {google.enabled && (
          <MapComponent
            allowZoom={this.props.allowZoom}
            apiKey={google.apiKey}
            center={this.getCenter()}
            clickedMarkerCentered={this.props.isClickedMarkerCentered}
            enableCreateMarker={this.props.enableCreateMarker}
            enableDrag={this.enableDrag}
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

  static getWidgetType(): WidgetType {
    return "MAP_WIDGET";
  }
}

export interface MapWidgetProps extends WidgetProps {
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
}

export default MapWidget;
