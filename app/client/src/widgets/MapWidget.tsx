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
      enableCreateMarker: VALIDATION_TYPES.BOOLEAN,
      zoomLevel: VALIDATION_TYPES.NUMBER,
      onMarkerClick: VALIDATION_TYPES.ACTION_SELECTOR,
      onCreateMarker: VALIDATION_TYPES.ACTION_SELECTOR,
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

  updateCenter = (lat: number, lng: number) => {
    this.updateWidgetMetaProperty("center", { lat, lng });
  };

  onCreateMarker = (lat: number, lng: number) => {
    const markers: Array<MarkerProps> = [...this.props.markers];
    markers.push({ lat: lat, lng: lng });
    this.updateWidgetMetaProperty("markers", markers);
    if (this.props.onCreateMarker) {
      super.executeAction({
        dynamicString: this.props.onCreateMarker,
        event: {
          type: EventType.ON_CREATE_MARKER,
        },
      });
    }
  };

  onMarkerClick = (lat: number, lng: number, title: string) => {
    this.updateWidgetMetaProperty("selectedMarker", {
      lat: lat,
      lng: lng,
      title: title,
    });
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
        enableCreateMarker={this.props.enableCreateMarker}
        updateCenter={this.updateCenter}
        isDisabled={this.props.isDisabled}
        enableSearch={this.props.enableSearch}
        enablePickLocation={this.props.enablePickLocation}
        saveMarker={this.onCreateMarker}
        selectMarker={this.onMarkerClick}
        markers={this.props.markers || []}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "MAP_WIDGET";
  }
}

export interface MarkerProps {
  lat: number;
  lng: number;
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
  enableCreateMarker: boolean;
  mapCenter: {
    lat: number;
    lng: number;
  };
  center?: {
    lat: number;
    lng: number;
  };
  defaultMarkers?: Array<MarkerProps>;
  markers?: Array<MarkerProps>;
  selectedMarker?: MarkerProps;
  onMarkerClick?: string;
  onCreateMarker?: string;
}

export default MapWidget;
