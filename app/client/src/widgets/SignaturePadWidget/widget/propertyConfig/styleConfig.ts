import { ValidationTypes } from "constants/WidgetValidation";

export default [
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "penColor",
        helpText: "Sets the background color of the pen",
        label: "Pen Color",
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
      {
        propertyName: "padBackgroundColor",
        helpText: "Sets the background color of the pad",
        label: "Pad Background Color",
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
