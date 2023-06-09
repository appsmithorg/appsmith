import { ButtonVariantTypes } from "components/constants";
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
        helpText: "Sets the variant of the icon button",
        options: [
          {
            label: "Primary",
            value: "PRIMARY",
          },
          {
            label: "Secondary",
            value: "SECONDARY",
          },
          {
            label: "Tertiary",
            value: "TERTIARY",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              ButtonVariantTypes.PRIMARY,
              ButtonVariantTypes.SECONDARY,
              ButtonVariantTypes.TERTIARY,
            ],
            default: ButtonVariantTypes.PRIMARY,
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
      },
      {
        propertyName: "iconAlign",
        label: "Position",
        helpText: "Sets the icon alignment of the button",
        controlType: "ICON_TABS",
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
