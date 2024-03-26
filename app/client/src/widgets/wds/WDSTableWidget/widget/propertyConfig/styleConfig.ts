import { ValidationTypes } from "constants/WidgetValidation";
import { updateColumnStyles } from "../propertyUtils";

export default [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "compactMode",
        helpText: "Selects row height",
        label: "Default row height",
        controlType: "ICON_TABS",
        fullWidth: true,
        defaultValue: "DEFAULT",
        isBindProperty: true,
        isTriggerProperty: false,
        options: [
          {
            label: "Short",
            value: "SHORT",
          },
          {
            label: "Default",
            value: "DEFAULT",
          },
          {
            label: "Tall",
            value: "TALL",
          },
        ],
      },
    ],
  },
  {
    sectionName: "Text formatting",
    children: [
      {
        propertyName: "textSize",
        label: "Text size",
        helpText: "Controls the size of text in the column",
        controlType: "DROP_DOWN",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            label: "S",
            value: "0.875rem",
            subText: "0.875rem",
          },
          {
            label: "M",
            value: "1rem",
            subText: "1rem",
          },
          {
            label: "L",
            value: "1.25rem",
            subText: "1.25rem",
          },
          {
            label: "XL",
            value: "1.875rem",
            subText: "1.875rem",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "fontStyle",
        label: "Emphasis",
        helpText: "Controls the style of the text in the column",
        controlType: "BUTTON_GROUP",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            icon: "text-bold",
            value: "BOLD",
          },
          {
            icon: "text-italic",
            value: "ITALIC",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "horizontalAlignment",
        label: "Text align",
        helpText: "Sets the horizontal alignment of the content in the column",
        controlType: "ICON_TABS",
        fullWidth: true,
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            startIcon: "align-left",
            value: "LEFT",
          },
          {
            startIcon: "align-center",
            value: "CENTER",
          },
          {
            startIcon: "align-right",
            value: "RIGHT",
          },
        ],
        defaultValue: "LEFT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["LEFT", "CENTER", "RIGHT"],
          },
        },
      },
      {
        propertyName: "verticalAlignment",
        label: "Vertical alignment",
        helpText: "Sets the vertical alignment of the content in the column",
        controlType: "ICON_TABS",
        fullWidth: true,
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            startIcon: "vertical-align-top",
            value: "TOP",
          },
          {
            startIcon: "vertical-align-middle",
            value: "CENTER",
          },
          {
            startIcon: "vertical-align-bottom",
            value: "BOTTOM",
          },
        ],
        defaultValue: "CENTER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["TOP", "CENTER", "BOTTOM"],
          },
        },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "cellBackground",
        label: "Cell background color",
        helpText: "Changes the background color of the cell",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "accentColor",
        label: "Accent color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        invisible: true,
      },
      {
        propertyName: "textColor",
        label: "Text color",
        helpText: "Controls the color of text in the column",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Border and shadow",
    children: [
      {
        propertyName: "variant",
        helpText: "Selects the variant",
        label: "Cell borders",
        controlType: "DROP_DOWN",
        defaultValue: "DEFAULT",
        isBindProperty: true,
        isTriggerProperty: false,
        options: [
          {
            label: "Default",
            value: "DEFAULT",
          },
          {
            label: "No borders",
            value: "VARIANT2",
          },
          {
            label: "Horizonal borders only",
            value: "VARIANT3",
          },
        ],
      },
      {
        propertyName: "borderRadius",
        label: "Border radius",
        helpText: "Rounds the corners of the icon button's outer border edge",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "boxShadow",
        label: "Box shadow",
        helpText:
          "Enables you to cast a drop shadow from the frame of the widget",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        propertyName: "borderColor",
        label: "Border color",
        controlType: "COLOR_PICKER",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Enter value for border width",
        propertyName: "borderWidth",
        label: "Border width",
        placeholderText: "Enter value in px",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.NUMBER },
      },
    ],
  },
];
