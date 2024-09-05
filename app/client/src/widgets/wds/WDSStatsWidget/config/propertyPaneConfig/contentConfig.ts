import { COLORS } from "@appsmith/wds";
import { ValidationTypes } from "constants/WidgetValidation";
import capitalize from "lodash/capitalize";

export const propertyPaneContentConfig = [
  {
    sectionName: "Fields",
    children: [
      {
        propertyName: "label",
        label: "Label",
        helpText: "Sets the label of the statbox",
        controlType: "INPUT_TEXT",
        placeholderText: "Active users",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "value",
        label: "Value",
        helpText: "Sets the value of the statbox",
        controlType: "INPUT_TEXT",
        placeholderText: "42",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "valueColor",
        label: "Value color",
        controlType: "DROP_DOWN",
        fullWidth: true,
        helpText: "Emphasizes the value's semantic impact",
        options: [
          {
            label: "Default",
            value: "default",
          },
          ...Object.values(COLORS).map((semantic) => ({
            label: capitalize(semantic),
            value: semantic,
          })),
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Optional Fields",
    children: [
      {
        propertyName: "iconName",
        label: "Select icon",
        helpText: "Sets the icon to be used for the statbox",
        controlType: "ICON_SELECT_V2",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
        },
      },
      {
        propertyName: "iconAlign",
        label: "Position",
        helpText: "Sets the icon alignment",
        controlType: "ICON_TABS",
        defaultValue: "start",
        fullWidth: false,
        options: [
          {
            startIcon: "skip-left-line",
            value: "start",
          },
          {
            startIcon: "skip-right-line",
            value: "end",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["start", "end"],
          },
        },
      },
      {
        propertyName: "valueChange",
        label: "Value change",
        helpText: "Secondary information about the value",
        controlType: "INPUT_TEXT",
        placeholderText: "+50%",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "valueChangeColor",
        label: "Color",
        controlType: "DROP_DOWN",
        fullWidth: true,
        helpText: "Emphasizes the change's semantic impact",
        options: Object.values(COLORS).map((semantic) => ({
          label: capitalize(semantic),
          value: semantic,
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(COLORS),
            default: COLORS.accent,
          },
        },
      },
      {
        propertyName: "caption",
        label: "Caption",
        helpText: "Sets the caption of the statbox",
        controlType: "INPUT_TEXT",
        placeholderText: "Since 21 Jan 2022",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
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
