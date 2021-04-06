import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import MapComponent from "components/designSystems/appsmith/MapComponent";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { getAppsmithConfigs } from "configs";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { DEFAULT_CENTER } from "constants/WidgetConstants";
import { getBorderCSSShorthand } from "constants/DefaultTheme";

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
          },
          {
            propertyName: "defaultMarkers",
            label: "Default markers",
            controlType: "INPUT_TEXT",
            inputType: "ARRAY",
            helpText: "Sets the default markers on the map",
            placeholderText: 'Enter [{ "lat": "val1", "long": "val2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "enableSearch",
            label: "Enable search location",
            helpText: "Enables locaton search",
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
            propertyName: "zoomLevel",
            label: "Zoom Level",
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
          },
        ],
      },
      {
        sectionName: "Actions",
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
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      defaultMarkers: VALIDATION_TYPES.MARKERS,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      enableSearch: VALIDATION_TYPES.BOOLEAN,
      enablePickLocation: VALIDATION_TYPES.BOOLEAN,
      enableCreateMarker: VALIDATION_TYPES.BOOLEAN,
      allowZoom: VALIDATION_TYPES.BOOLEAN,
      zoomLevel: VALIDATION_TYPES.NUMBER,
      mapCenter: VALIDATION_TYPES.LAT_LONG,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      markers: "defaultMarkers",
      center: "mapCenter",
    };
  }

  static getMetaPropertiesMap(): Record<string, undefined> {
    return {
      center: undefined,
      markers: undefined,
      selectedMarker: undefined,
    };
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
  }

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
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.appsmith.com/v/v1.2.1/setup/docker/google-maps"
              >
                {" documentation "}
              </a>
              {"to configure API Keys"}
            </p>
          </DisabledContainer>
        )}
        {google.enabled && (
          <MapComponent
            apiKey={google.apiKey}
            widgetId={this.props.widgetId}
            isVisible={this.props.isVisible}
            zoomLevel={this.props.zoomLevel}
            allowZoom={this.props.allowZoom}
            center={this.getCenter()}
            enableCreateMarker={this.props.enableCreateMarker}
            selectedMarker={this.props.selectedMarker}
            updateCenter={this.updateCenter}
            isDisabled={this.props.isDisabled}
            enableSearch={this.props.enableSearch}
            enablePickLocation={this.props.enablePickLocation}
            saveMarker={this.onCreateMarker}
            updateMarker={this.updateMarker}
            selectMarker={this.onMarkerClick}
            unselectMarker={this.unselectMarker}
            markers={this.props.markers}
            enableDrag={() => {
              this.disableDrag(false);
            }}
          />
        )}
      </>
    );
  }

  getWidgetType(): WidgetType {
    return "MAP_WIDGET";
  }
}

export interface MarkerProps {
  lat: number;
  long: number;
  title?: string;
  description?: string;
}

export interface MapWidgetProps extends WidgetProps, WithMeta {
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
  };
  onMarkerClick?: string;
  onCreateMarker?: string;
}

export default MapWidget;
export const ProfiledMapWidget = Sentry.withProfiler(withMeta(MapWidget));
