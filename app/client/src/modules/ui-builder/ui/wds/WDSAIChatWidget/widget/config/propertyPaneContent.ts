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
      {
        helpText: "Select a query to submit when a chat message is sent.",
        propertyName: "query",
        label: "Query to trigger",
        controlType: "INPUT_TEXT",
        placeholderText: "Value",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        dependencies: ["queryData", "queryRun"],
        updateHook: (
          props: unknown,
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
    ],
  },
];
