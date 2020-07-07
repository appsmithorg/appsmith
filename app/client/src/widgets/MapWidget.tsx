import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import MapComponent from "components/designSystems/appsmith/MapComponent";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { EventType } from "constants/ActionConstants";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

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
      // onMarkerClick: VALIDATION_TYPES.ACTION_SELECTOR,
      // onCreateMarker: VALIDATION_TYPES.ACTION_SELECTOR,
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
    };
  }

  updateCenter = (lat: number, long: number) => {
    this.updateWidgetMetaProperty("center", { lat, long });
  };

  updateMarker = (lat: number, long: number, index: number) => {
    const markers: Array<MarkerProps> = [...this.props.markers];
    this.disableDrag(false);
    this.updateWidgetMetaProperty(
      "markers",
      markers.map((marker, i) => {
        if (index === i) {
          marker.lat = lat;
          marker.long = long;
        }
        return marker;
      }),
    );
  };

  onCreateMarker = (lat: number, long: number) => {
    this.disableDrag(true);
    this.updateWidgetMetaProperty("selectedMarker", {
      lat: lat,
      long: long,
    });
    if (this.props.onCreateMarker) {
      super.executeAction({
        dynamicString: this.props.onCreateMarker,
        event: {
          type: EventType.ON_CREATE_MARKER,
        },
      });
    }
  };

  onMarkerClick = (lat: number, long: number, title: string) => {
    this.updateWidgetMetaProperty("selectedMarker", {
      lat: lat,
      long: long,
      title: title,
    });
    this.disableDrag(true);
    if (this.props.onMarkerClick) {
      super.executeAction({
        dynamicString: this.props.onMarkerClick,
        event: {
          type: EventType.ON_MARKER_CLICK,
        },
      });
    }
  };

  // componentDidMount() {
  //   super.componentDidMount();
  //   if (this.props.mapCenter) {
  //     this.updateWidgetMetaProperty("center", this.props.mapCenter);
  //   }
  // }
  //
  // componentDidUpdate(prevProps: MapWidgetProps) {
  //   super.componentDidUpdate(prevProps);
  //   if (
  //     this.props.mapCenter &&
  //     prevProps.mapCenter &&
  //     (this.props.mapCenter.lat !== prevProps.mapCenter.lat ||
  //       this.props.mapCenter.lng !== prevProps.mapCenter.lng)
  //   ) {
  //     this.updateWidgetMetaProperty("center", this.props.mapCenter);
  //   }
  // }

  getPageView() {
    return (
      <MapComponent
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
