import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "elevatedBackground",
        label: "Visual Separation",
        controlType: "SWITCH",
        fullWidth: true,
        helpText:
          "Sets the semantic elevated background and/or borders of the section. This separates the section visually. This could be useful for separating the contents of this section visually from the rest of the sections in the page",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        isReusable: true,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    ],
  },
];
