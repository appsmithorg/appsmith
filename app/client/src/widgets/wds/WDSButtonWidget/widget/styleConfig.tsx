import { capitalize } from "lodash";
import { COLORS, BUTTON_VARIANTS } from "@design-system/widgets";

import { ValidationTypes } from "constants/WidgetValidation";
import type { ButtonWidgetProps } from "./types";

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
        options: Object.values(BUTTON_VARIANTS).map((variant) => ({
          label: capitalize(variant),
          value: variant,
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(BUTTON_VARIANTS),
            default: BUTTON_VARIANTS.filled,
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
  {
    sectionName: "Icon",
    children: [
      {
        propertyName: "iconName",
        label: "Select icon",
        helpText: "Sets the icon to be used for the button",
        controlType: "ICON_SELECT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
        },
        updateHook: (
          props: ButtonWidgetProps,
          propertyPath: string,
          propertyValue: string,
        ) => {
          const propertiesToUpdate = [{ propertyPath, propertyValue }];

          if (!props.iconAlign) {
            propertiesToUpdate.push({
              propertyPath: "iconAlign",
              propertyValue: "start",
            });
          }

          return propertiesToUpdate;
        },
      },
      {
        propertyName: "iconAlign",
        label: "Position",
        helpText: "Sets the icon alignment of the button",
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
    ],
  },
];
