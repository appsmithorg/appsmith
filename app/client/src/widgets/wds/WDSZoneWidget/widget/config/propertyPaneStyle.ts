import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyle = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "elevatedBackground",
        label: "Visual separation",
        controlType: "SWITCH",
        fullWidth: true,
        helpText:
          "Sets the semantic elevated background and/or borders of the zone. This separates the zone visually. This could be useful for separating the contents of this zone visually from the rest of the zones in the section",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
        isReusable: true,
      },
    ],
  },
];
