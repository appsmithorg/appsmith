import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";

import LeafletComponent from "../component";

import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { DEFAULT_CENTER } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { MarkerProps } from "react-leaflet";
import styleConfig from "./styleConfig";
import contentConfig from "./contentConfig";

const DefaultCenter = { ...DEFAULT_CENTER, long: DEFAULT_CENTER.lng };

type Center = {
  lat: number;
  long: number;
  [x: string]: any;
};

class LeafletWidget extends BaseWidget<LeafletWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return contentConfig.concat(styleConfig);
  }
  static getPropertyPaneContentConfig() {
    return contentConfig;
  }
  static getPropertyPaneStyleConfig() {
    return styleConfig;
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
