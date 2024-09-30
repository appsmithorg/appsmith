import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContent = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        label: "Visible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        defaultValue: true,
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "when the message is sent",
        propertyName: "onMessageSent",
        label: "onMessageSent",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];
