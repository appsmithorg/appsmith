import { COLORS } from "@design-system/widgets";
import { TYPOGRAPHY_VARIANTS } from "@design-system/theming";
import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "fontSize",
        label: "Font size",
        helpText: "Controls the size of the font used",
        controlType: "DROP_DOWN",
        defaultValue: "body",
        options: [
          {
            label: "Footnote",
            value: "footnote",
          },
          {
            label: "Body",
            value: "body",
          },
          {
            label: "Caption",
            value: "caption",
          },
          {
            label: "Subtitle",
            value: "subtitle",
          },
          {
            label: "Title",
            value: "title",
          },
          {
            label: "Heading",
            value: "heading",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(TYPOGRAPHY_VARIANTS),
            default: TYPOGRAPHY_VARIANTS.body,
          },
        },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "textColor",
        label: "Text Color",
        helpText: "Controls the color of the text displayed",
        controlType: "DROP_DOWN",
        defaultValue: "neutral",
        options: [
          {
            label: "Accent",
            value: "accent",
          },
          {
            label: "Neutral",
            value: "neutral",
          },
          {
            label: "Positive",
            value: "positive",
          },
          {
            label: "Negative",
            value: "negative",
          },
          {
            label: "Warning",
            value: "warning",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(COLORS),
            default: COLORS.neutral,
          },
        },
      },
    ],
  },
  {
    sectionName: "Text formatting",
    children: [
      {
        propertyName: "textAlign",
        label: "Alignment",
        helpText: "Controls the horizontal alignment of the text",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            startIcon: "align-left",
            value: "left",
          },
          {
            startIcon: "align-center",
            value: "center",
          },
          {
            startIcon: "align-right",
            value: "right",
          },
        ],
        defaultValue: "left",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["left", "center", "right"],
            default: "left",
          },
        },
      },
      {
        propertyName: "fontStyle",
        label: "Emphasis",
        helpText: "Controls the font emphasis of the text displayed",
        controlType: "BUTTON_GROUP",
        options: [
          {
            icon: "text-bold",
            value: "bold",
          },
          {
            icon: "text-italic",
            value: "italic",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
