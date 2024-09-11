import { TYPOGRAPHY_VARIANTS } from "@appsmith/wds-theming";
import { ValidationTypes } from "constants/WidgetValidation";

import { fontSizeUpdateHook } from "../../helpers";

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
            label: "Body",
            value: "body",
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
        updateHook: fontSizeUpdateHook,
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
        isReusable: true,
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
        isReusable: true,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
