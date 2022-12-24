import { ValidationTypes } from "constants/WidgetValidation";

export default [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Controls the size of the slider",
        propertyName: "sliderSize",
        label: "Size",
        controlType: "ICON_TABS",
        fullWidth: true,
        defaultValue: "m",
        options: [
          {
            label: "S",
            value: "s",
            subText: "4px",
          },
          {
            label: "M",
            value: "m",
            subText: "6px",
          },
          {
            label: "L",
            value: "l",
            subText: "8px",
          },
        ],
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Label Styles",
    children: [
      {
        propertyName: "labelTextColor",
        label: "Font Color",
        helpText: "Control the color of the label associated",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "labelTextSize",
        label: "Font Size",
        helpText: "Control the font size of the label associated",
        controlType: "DROP_DOWN",
        defaultValue: "0.875rem",
        options: [
          {
            label: "S",
            value: "0.875rem",
            subText: "0.875rem",
          },
          {
            label: "M",
            value: "1rem",
            subText: "1rem",
          },
          {
            label: "L",
            value: "1.25rem",
            subText: "1.25rem",
          },
          {
            label: "XL",
            value: "1.875rem",
            subText: "1.875rem",
          },
          {
            label: "XXL",
            value: "3rem",
            subText: "3rem",
          },
          {
            label: "3XL",
            value: "3.75rem",
            subText: "3.75rem",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "labelStyle",
        label: "Emphasis",
        helpText: "Control if the label should be bold or italics",
        controlType: "BUTTON_TABS",
        options: [
          {
            icon: "BOLD_FONT",
            value: "BOLD",
          },
          {
            icon: "ITALICS_FONT",
            value: "ITALIC",
          },
        ],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        helpText: "Sets the fill color of the widget",
        propertyName: "accentColor",
        label: "Fill Color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
