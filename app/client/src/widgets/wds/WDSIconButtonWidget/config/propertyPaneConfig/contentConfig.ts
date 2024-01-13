import { ValidationTypes } from "constants/WidgetValidation";
import { IconNames } from "@blueprintjs/icons";

const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export const propertyPaneContentConfig = [
  {
    sectionName: "Basic",
    children: [
      {
        propertyName: "iconName",
        label: "Icon",
        helpText: "Sets the icon to be used for the icon button",
        controlType: "ICON_SELECT",
        defaultIconName: "plus",
        hideNoneIcon: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
            default: IconNames.PLUS,
          },
        },
      },
      {
        helpText: "when the button is clicked",
        propertyName: "onClick",
        label: "onClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        helpText: "Show helper text with button on hover",
        propertyName: "tooltip",
        label: "Tooltip",
        controlType: "INPUT_TEXT",
        placeholderText: "Add Input Field",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "isVisible",
        helpText: "Controls the visibility of the widget",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isDisabled",
        helpText: "Disables input to the widget",
        label: "Disabled",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "animateLoading",
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
];
