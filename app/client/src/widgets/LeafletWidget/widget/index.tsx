import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";

import LeafletComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { DEFAULT_CENTER } from "constants/WidgetConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { MarkerProps } from "react-leaflet";

const DefaultCenter = { ...DEFAULT_CENTER, long: DEFAULT_CENTER.lng };

type Center = {
  lat: number;
  long: number;
  [x: string]: any;
};

class LeafletWidget extends BaseWidget<LeafletWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "url",
            label: "URL for Tile Layer",
            helpText:
              "Url for maptiles, ensure you comply with any usage policy.",
            controlType: "INPUT_TEXT",
            defaultValue: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
          },
          {
            propertyName: "attribution",
            label: "Attribution",
            helpText:
              "It is a moral duty of data users to give credit where credit is due.",
            controlType: "INPUT_TEXT",
            defaultValue:
              "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
          },
          {
            propertyName: "mapCenter",
            label: "Initial location",
            isJSConvertible: true,
            controlType: "LOCATION_SEARCH",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
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
            propertyName: "enableCreateMarker",
            label: "Create new marker",
            helpText: "Allows users to mark locations on the map",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "enableReplaceMarker",
            label: "Replace existing marker",
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
            propertyName: "zoom",
            label: "Zoom",
            helpText: "Zoom level of map",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                min: 0,
                max: 25,
                default: 10,
              },
            },
          },
          {
            propertyName: "markerText",
            label: "Marker Text",
            helpText: "Text of marker in center of map",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
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
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
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
            label: "Box Shadow",
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
  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }
  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      markers: "defaultMarkers",
      center: "mapCenter",
      tiles: "url",
    };
  }
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      center: undefined,
      markers: undefined,
      selectedMarker: undefined,
    };
  }
  getCenter(): Center {
    return this.props.center || this.props.mapCenter || DefaultCenter;
  }
  onCreateMarker = (lat: number, long: number) => {
    this.disableDrag(true);
    const marker = { lat, long, title: "" };

    const markers = [];
    if (this.props.enableReplaceMarker) {
      marker.title = this.props.defaultMarkers[0].title;
      markers.push(marker);
    } else {
      (this.props.markers || []).forEach((m: MarkerProps) => {
        markers.push(m);
      });
      markers.push(marker);
    }
    this.props.updateWidgetMetaProperty("markers", markers);
    this.props.updateWidgetMetaProperty("selectedMarker", marker, {
      triggerPropertyName: "onCreateMarker",
      dynamicString: this.props.onCreateMarker,
      event: {
        type: EventType.ON_CREATE_MARKER,
      },
    });
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
  unselectMarker = () => {
    this.props.updateWidgetMetaProperty("selectedMarker", undefined);
  };
  updateCenter = (lat: number, long: number, title?: string) => {
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
  getPageView() {
    return (
      <LeafletComponent
        allowZoom={this.props.allowZoom}
        attribution={this.props.attribution}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        center={this.getCenter()}
        clickedMarkerCentered={this.props.clickedMarkerCentered}
        defaultMarkers={this.props.defaultMarkers}
        enableCreateMarker={this.props.enableCreateMarker}
        enableDrag={this.props.enableDrag}
        enablePickLocation={false}
        enableReplaceMarker={this.props.enableReplaceMarker}
        lat={this.props.lat}
        long={this.props.long}
        mapCenter={this.getCenter()}
        markerText={this.props.markerText}
        markers={this.props.markers}
        saveMarker={this.onCreateMarker}
        selectMarker={this.onMarkerClick}
        selectedMarker={this.props.selectedMarker}
        unselectMarker={this.unselectMarker}
        updateCenter={this.updateCenter}
        updateMarker={this.updateMarker}
        url={this.props.url}
        widgetId={this.props.widgetId}
        zoom={this.props.zoom}
      />
    );
  }

  static getWidgetType(): string {
    return "LEAFLET_WIDGET";
  }
}

export interface LeafletWidgetProps extends WidgetProps {
  lat: number;
  long: number;
  zoom: number;
  markerText: string;
}

export default LeafletWidget;
