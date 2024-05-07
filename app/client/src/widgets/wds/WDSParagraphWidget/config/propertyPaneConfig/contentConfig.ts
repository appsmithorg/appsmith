import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContentConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "text",
        helpText: "Sets the text of the widget",
        label: "Text",
        controlType: "INPUT_TEXT",
        placeholderText:
          "The important thing is not to stop questioning. Curiosity has its own reason for existence.",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: { limitLineBreaks: true },
        },
      },
      {
        propertyName: "lineClamp",
        helpText: "Controls the number of lines displayed",
        label: "Line clamp (max lines)",
        controlType: "INPUT_TEXT",
        placeholderText: "unlimited",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 1,
          },
        },
      },
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
