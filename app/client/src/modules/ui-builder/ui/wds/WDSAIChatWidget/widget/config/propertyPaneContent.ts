import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContent = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Gives the open AI Assistant a name to be displayed in chat",
        propertyName: "assistantName",
        label: "Assistant Name",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        defaultValue: "",
      },
      {
        propertyName: "senderName",
        label: "Sender Name",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        defaultValue: "",
      },
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
