import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyle = [
  {
    sectionName: "Background",
    children: [
      {
        propertyName: "elevatedBackground",
        label: "Background",
        controlType: "SWITCH",
        fullWidth: true,
        helpText: "Sets the semantic elevated background of the section",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    ],
  },
];
