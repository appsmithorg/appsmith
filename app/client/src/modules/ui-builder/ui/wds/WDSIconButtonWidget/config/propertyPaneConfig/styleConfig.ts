import { capitalize } from "lodash";
import { BUTTON_VARIANTS, COLORS } from "@appsmith/wds";
import { objectKeys } from "@appsmith/utils";
import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "buttonVariant",
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
        isReusable: true,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: objectKeys(BUTTON_VARIANTS),
            default: objectKeys(BUTTON_VARIANTS)[0],
          },
        },
      },
      {
        propertyName: "buttonColor",
        label: "Button color",
        controlType: "DROP_DOWN",
        fullWidth: true,
        helpText: "Sets the semantic color of the button",
        options: Object.values(COLORS).map((semantic) => ({
          label: capitalize(semantic),
          value: semantic,
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        isReusable: true,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(COLORS),
            default: COLORS.accent,
          },
        },
      },
    ],
  },
];
