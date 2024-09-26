import { BUTTON_VARIANTS, COLORS } from "@appsmith/wds";
import { ValidationTypes } from "constants/WidgetValidation";
import { capitalize } from "lodash";
import { objectKeys } from "@appsmith/utils";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "variant",
        label: "Button variant",
        controlType: "ICON_TABS",
        fullWidth: true,
        helpText: "Sets the variant of the button",
        options: objectKeys(BUTTON_VARIANTS).map((variant) => ({
          label: BUTTON_VARIANTS[variant],
          value: variant,
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        defaultValue: "ghost",
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: objectKeys(BUTTON_VARIANTS),
            default: objectKeys(BUTTON_VARIANTS)[0],
          },
        },
      },
      {
        propertyName: "color",
        label: "Button color",
        controlType: "DROP_DOWN",
        defaultValue: "accent",
        fullWidth: true,
        helpText: "Sets the semantic color of the button",
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
        propertyName: "alignment",
        helpText: "Sets the alignment of the widget",
        label: "Alignment",
        controlType: "ICON_TABS",
        defaultValue: "start",
        isBindProperty: true,
        isTriggerProperty: false,
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
      },
    ],
  },
];
