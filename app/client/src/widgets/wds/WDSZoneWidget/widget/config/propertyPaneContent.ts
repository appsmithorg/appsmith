import { ValidationTypes } from "constants/WidgetValidation";

export const propertyPaneContent = [
  {
    sectionName: "Section Split",
    children: [
      {
        propertyName: "parentId",
        label: "",
        controlType: "SECTION_SPLITTER",
        helpText: "Distribute the 12 column section space between zones",
        isBindProperty: true,
        isJSConvertible: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "parentId",
        label: "Zones",
        controlType: "ZONE_STEPPER",
        helpText: "Changes the no. of zones in a section",
        isBindProperty: true,
        isJSConvertible: false,
        isTriggerProperty: false,
      },
    ],
  },
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
