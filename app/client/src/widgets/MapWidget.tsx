import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import MapComponent from "components/designSystems/appsmith/MapComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType } from "constants/ActionConstants";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { getAppsmithConfigs } from "configs";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { ActionDescription } from "../entities/DataTree/dataTreeFactory";

const { google } = getAppsmithConfigs();

const DisabledContainer = styled.div`
  background-color: white;
  height: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  h1 {
    margin-top: 15%;
    margin-bottom: 10%;
    color: #7c7c7c;
  }
  p {
    color: #0a0b0e;
  }
`;
class MapWidget extends BaseWidget<MapWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      defaultMarkers: VALIDATION_TYPES.MARKERS,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      enableSearch: VALIDATION_TYPES.BOOLEAN,
      enablePickLocation: VALIDATION_TYPES.BOOLEAN,
      allowZoom: VALIDATION_TYPES.BOOLEAN,
      zoomLevel: VALIDATION_TYPES.NUMBER,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onMarkerClick: true,
      onCreateMarker: true,
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
          marker.lat = lat;
          marker.long = long;
        }
        return marker;
      },
    );
    this.disableDrag(false);
    this.props.updateWidgetMetaProperty("markers", markers);
  };

  onCreateMarker = (lat: number, long: number) => {
    this.disableDrag(true);
    this.props.updateWidgetMetaProperty(
      "selectedMarker",
      {
        lat,
        long,
      },
      {
        triggers: this.props.onCreateMarker,
        event: {
          type: EventType.ON_CREATE_MARKER,
        },
      },
    );
  };

  onMarkerClick = (lat: number, long: number, title: string) => {
    this.disableDrag(true);
    const selectedMarker = {
      lat: lat,
      long: long,
      title: title,
    };
    this.props.updateWidgetMetaProperty("selectedMarker", selectedMarker, {
      triggers: this.props.onMarkerClick,
      event: {
        type: EventType.ON_MARKER_CLICK,
      },
    });
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
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.appsmith.com/third-party-services/google-maps"
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
            center={this.props.center || this.props.mapCenter}
            enableCreateMarker
            selectedMarker={this.props.selectedMarker}
            updateCenter={this.updateCenter}
            isDisabled={this.props.isDisabled}
            enableSearch={this.props.enableSearch}
            enablePickLocation={this.props.enablePickLocation}
            saveMarker={this.onCreateMarker}
            updateMarker={this.updateMarker}
            selectMarker={this.onMarkerClick}
            markers={this.props.markers || []}
            disableDrag={() => {
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
  onMarkerClick?: ActionDescription<any>[];
  onCreateMarker?: ActionDescription<any>[];
}

export default MapWidget;
export const ProfiledMapWidget = Sentry.withProfiler(withMeta(MapWidget));
