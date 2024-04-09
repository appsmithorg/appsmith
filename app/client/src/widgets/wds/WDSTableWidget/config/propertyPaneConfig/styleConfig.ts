import { ValidationTypes } from "constants/WidgetValidation";
import { updateColumnStyles } from "../../widget/propertyUtils";

export const styleConfig = [
  {
    sectionName: "Text formatting",
    children: [
      {
        propertyName: "fontStyle",
        label: "Emphasis",
        helpText: "Controls the style of the text in the column",
        controlType: "BUTTON_GROUP",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            icon: "text-bold",
            value: "BOLD",
          },
          {
            icon: "text-italic",
            value: "ITALIC",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "horizontalAlignment",
        label: "Text align",
        helpText: "Sets the horizontal alignment of the content in the column",
        controlType: "ICON_TABS",
        fullWidth: true,
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            startIcon: "align-left",
            value: "start",
          },
          {
            startIcon: "align-center",
            value: "center",
          },
          {
            startIcon: "align-right",
            value: "end",
          },
        ],
        defaultValue: "start",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["start", "center", "end"],
          },
        },
      },
      {
        propertyName: "verticalAlignment",
        label: "Vertical alignment",
        helpText: "Sets the vertical alignment of the content in the column",
        controlType: "ICON_TABS",
        fullWidth: true,
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        options: [
          {
            startIcon: "vertical-align-top",
            value: "start",
          },
          {
            startIcon: "vertical-align-middle",
            value: "center",
          },
          {
            startIcon: "vertical-align-bottom",
            value: "end",
          },
        ],
        defaultValue: "center",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["start", "center", "end"],
          },
        },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "cellBackground",
        label: "Cell background color",
        helpText: "Changes the background color of the cell",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "accentColor",
        label: "Accent color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        invisible: true,
      },
      {
        propertyName: "textColor",
        label: "Text color",
        helpText: "Controls the color of text in the column",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Border and shadow",
    children: [
      {
        propertyName: "variant",
        helpText: "Selects the variant",
        label: "Cell borders",
        controlType: "DROP_DOWN",
        defaultValue: "DEFAULT",
        isBindProperty: true,
        isTriggerProperty: false,
        options: [
          {
            label: "Default",
            value: "DEFAULT",
          },
          {
            label: "No borders",
            value: "VARIANT2",
          },
          {
            label: "Horizonal borders only",
            value: "VARIANT3",
          },
        ],
      },
    ],
  },
];
