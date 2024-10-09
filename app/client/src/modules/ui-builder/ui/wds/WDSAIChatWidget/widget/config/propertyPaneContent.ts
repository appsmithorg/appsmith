import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContent = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Select a query to submit when a chat message is sent.",
        propertyName: "query",
        label: "Query to trigger",
        controlType: "INPUT_TEXT",
        placeholderText: "Value",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        dependencies: ["queryData", "queryRun"],
        updateHook: (
          _props: unknown,
          propertyPath: string,
          propertyValue: string,
        ) => {
          const propertiesToUpdate = [{ propertyPath, propertyValue }];

          propertiesToUpdate.push({
            propertyPath: "queryData",
            propertyValue: `{{${propertyValue}.data}}`,
          });
          propertiesToUpdate.push({
            propertyPath: "queryRun",
            propertyValue: propertyValue,
          });

          return propertiesToUpdate;
        },
      },
      {
        helpText: "Adds a header to the chat",
        propertyName: "chatTitle",
        label: "Title",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "",
      },
      {
        helpText:
          "Adds a description to help users understand how to use the chat",
        propertyName: "chatDescription",
        label: "Description",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "",
      },
      {
        helpText: "Adds a placeholder text to the message input box",
        propertyName: "promptInputPlaceholder",
        label: "Placeholder",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "",
      },
      {
        helpText: "Gives the open AI Assistant a name to be displayed in chat",
        propertyName: "assistantName",
        label: "Assistant Name",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "",
      },
      {
        helpText: "Configures a prompt for the assistant",
        propertyName: "systemPrompt",
        label: "Prompt",
        controlType: "INPUT_TEXT",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
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
    sectionName: "Hidden props",
    children: [
      {
        propertyName: "queryData",
        label: "",
        controlType: "INPUT_TEXT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: () => true,
      },
      {
        propertyName: "queryRun",
        label: "",
        controlType: "INPUT_TEXT",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: () => true,
      },
      // Fake hidden prop to pass the username to the widget
      {
        propertyName: "username",
        label: "",
        controlType: "INPUT_TEXT",
        defaultValue: "{{appsmith.user.username}}",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: () => true,
        invisible: true,
      },
    ],
  },
];
