import capitalize from "lodash/capitalize";
import { ICONS } from "@design-system/widgets";
import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContentConfig = [
  {
    sectionName: "Basic",
    children: [
      {
        propertyName: "iconName",
        label: "Icon",
        helpText: "Sets the icon to be used for the icon button",
        controlType: "ICON_SELECT_V2",
        defaultIconName: "plus",
        hideNoneIcon: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.keys(ICONS) as unknown as string[],
            default: "plus",
          },
        },
      },
      {
        propertyName: "iconStyle",
        label: "Icon Style",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the style of the icon button",
        options: ["filled", "outlined"].map((variant) => ({
          label: capitalize(variant),
          value: variant,
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["filled", "outlined"],
            default: "outlined",
          },
        },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
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
