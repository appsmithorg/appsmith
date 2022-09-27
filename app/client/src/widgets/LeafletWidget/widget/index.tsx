import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import LeafletComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";

class LeafletWidget extends BaseWidget<LeafletWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "lat",
            label: "Latitude",
            helpText: "Latitude of center of map",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                min: -180,
                max: 180,
                default: 0,
              },
            },
          },
          {
            propertyName: "long",
            label: "Longitude",
            helpText: "Longitude of center of map",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSconvertible: true,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                min: -180,
                max: 180,
                default: 0,
              },
            },
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
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  getPageView() {
    const {
      borderRadius,
      boxShadow,
      enableDrag,
      lat,
      long,
      markerText,
      zoom,
    } = this.props;
    return (
      <LeafletComponent
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        enableDrag={enableDrag}
        lat={lat}
        long={long}
        markerText={markerText}
        zoom={zoom}
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
