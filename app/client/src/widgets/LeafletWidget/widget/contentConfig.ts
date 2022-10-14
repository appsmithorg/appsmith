import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

export default [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "url",
        label: "URL for Tile Layer",
        helpText: "Url for maptiles, ensure you comply with any usage policy.",
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
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        propertyName: "isClickedMarkerCentered",
        label: "Map & Marker centering",
        helpText: "Controls whether the clicked marker is centered on the map",
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
        propertyName: "circles",
        label: "Circles to draw on Map",
        controlType: "INPUT_TEXT",
        inputType: "ARRAY",
        helpText: "Draws circles on the map",
        placeholderText:
          '[{ ["lat": "val1", "long": "val2"], "options:"{"radius":"val3"}}]',
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
                    name: "options",
                    type: ValidationTypes.OBJECT,
                    allowedKeys: [
                      {
                        name: "radius",
                        type: ValidationTypes.NUMBER,
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
                ],
              },
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
        propertyName: "allowZoom",
        label: "Show Zoom control",
        controlType: "SWITCH",
        helpText: "Controls the visibility of the zoom controls",
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
        helpText: "Rounds the corners of the icon button's outer border edge",
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
