import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Controls widget orientation",
        propertyName: "orientation",
        label: "Orientation",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          {
            label: "Horizontal",
            value: "horizontal",
          },
          {
            label: "Vertical",
            value: "vertical",
          },
        ],
        defaultValue: "vertical",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Sets the label position of the widget",
        propertyName: "labelPosition",
        label: "Options Label Position",
        controlType: "ICON_TABS",
        fullWidth: true,
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        defaultValue: "right",
      },
    ],
  },
];
