import { ValidationTypes } from "constants/WidgetValidation";
import { ButtonPlacementTypes } from "components/constants";
import { updateStyles } from "../propertyUtils";

export default [
  {
    sectionName: "Icon",
    children: [
      {
        propertyName: "iconName",
        label: "Select Icon",
        helpText: "Sets the icon to be used for the button",
        controlType: "ICON_SELECT",
        isBindProperty: false,
        isTriggerProperty: false,
        updateHook: updateStyles,
        dependencies: ["iconAlign"],
        validation: {
          type: ValidationTypes.TEXT,
        },
      },
      {
        propertyName: "iconAlign",
        label: "Position",
        helpText: "Sets the icon alignment of the button",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            icon: "VERTICAL_LEFT",
            value: "left",
          },
          {
            icon: "VERTICAL_RIGHT",
            value: "right",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["center", "left", "right"],
          },
        },
      },
      {
        propertyName: "placement",
        label: "Placement",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the space between items",
        options: [
          {
            label: "Start",
            value: ButtonPlacementTypes.START,
          },
          {
            label: "Between",
            value: ButtonPlacementTypes.BETWEEN,
          },
          {
            label: "Center",
            value: ButtonPlacementTypes.CENTER,
          },
        ],
        defaultValue: ButtonPlacementTypes.CENTER,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              ButtonPlacementTypes.START,
              ButtonPlacementTypes.BETWEEN,
              ButtonPlacementTypes.CENTER,
            ],
            default: ButtonPlacementTypes.CENTER,
          },
        },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "buttonColor",
        helpText: "Sets the background color of the button",
        label: "Button Color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            regex: /^(?![<|{{]).+/,
          },
        },
      },
    ],
  },
  {
    sectionName: "Border and Shadow",
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
