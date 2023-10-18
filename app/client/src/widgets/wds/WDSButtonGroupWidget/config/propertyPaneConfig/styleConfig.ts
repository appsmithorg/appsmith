import {
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_VARIANTS,
  COLORS,
} from "@design-system/widgets";
import { ValidationTypes } from "constants/WidgetValidation";
import { capitalize } from "lodash";

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
        options: [
          {
            label: "Primary",
            value: BUTTON_VARIANTS.filled,
          },
          {
            label: "Secondary",
            value: BUTTON_VARIANTS.outlined,
          },
          {
            label: "Tertiary",
            value: BUTTON_VARIANTS.ghost,
          },
        ],
        defaultValue: BUTTON_VARIANTS.filled,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              BUTTON_VARIANTS.filled,
              BUTTON_VARIANTS.outlined,
              BUTTON_VARIANTS.ghost,
            ],
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
      {
        helpText: "Controls widget orientation",
        propertyName: "orientation",
        label: "Orientation",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            label: capitalize(BUTTON_GROUP_ORIENTATIONS.horizontal),
            value: BUTTON_GROUP_ORIENTATIONS.horizontal,
          },
          {
            label: capitalize(BUTTON_GROUP_ORIENTATIONS.vertical),
            value: BUTTON_GROUP_ORIENTATIONS.vertical,
          },
        ],
        defaultValue: BUTTON_GROUP_ORIENTATIONS.horizontal,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
