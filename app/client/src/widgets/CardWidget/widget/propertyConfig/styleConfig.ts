import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

import type { CardWidgetProps } from "../../constants";

export default [
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "backgroundColor",
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        label: "Background color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "borderColor",
        helpText: "Use a html color name, HEX, RGB or RGBA value",
        placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
        label: "Border color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "selectedAccentColor",
        helpText:
          "Sets the accent border color shown when the card is selected",
        label: "Selected accent color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: CardWidgetProps) => !props.selectionEnabled,
        dependencies: ["selectionEnabled"],
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Dividers and elevation",
    children: [
      {
        propertyName: "showHeaderDivider",
        helpText: "Shows a divider between the header and the card body",
        label: "Header divider",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "showFooterDivider",
        helpText: "Shows a divider between the card body and the footer",
        label: "Footer divider",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "hoverElevation",
        helpText: "Lifts the card with a stronger shadow on hover",
        label: "Hover elevation",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Border and shadow",
    children: [
      {
        propertyName: "borderWidth",
        helpText: "Enter value for border width",
        label: "Border width",
        placeholderText: "Enter value in px",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.NUMBER },
        postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
      },
      {
        propertyName: "borderRadius",
        label: "Border radius",
        helpText: "Rounds the corners of the widget's outer border edge",
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
    ],
  },
] as PropertyPaneConfig[];
