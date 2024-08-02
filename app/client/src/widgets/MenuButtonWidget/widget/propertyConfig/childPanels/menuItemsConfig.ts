import { ValidationTypes } from "constants/WidgetValidation";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateHook: (props: any, propertyPath: string, propertyValue: string) => {
    return [
      {
        propertyPath,
        propertyValue,
      },
    ];
  },

  contentChildren: [
    {
      sectionName: "Basic",
      children: [
        {
          propertyName: "label",
          helpText: "Sets the label of a menu item",
          label: "Label",
          controlType: "INPUT_TEXT",
          placeholderText: "Download",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          helpText: "when the menu item is clicked",
          propertyName: "onClick",
          label: "onClick",
          controlType: "ACTION_SELECTOR",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
      ],
    },
    {
      sectionName: "General",
      children: [
        {
          propertyName: "isVisible",
          helpText: "Controls the visibility of the widget",
          label: "Visible",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
        {
          propertyName: "isDisabled",
          helpText: "Disables input to the widget",
          label: "Disabled",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
      ],
    },
  ],

  styleChildren: [
    {
      sectionName: "Icon",
      children: [
        {
          propertyName: "iconName",
          label: "Icon",
          helpText: "Sets the icon to be used for a menu item",
          controlType: "ICON_SELECT",
          isBindProperty: false,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          propertyName: "iconAlign",
          label: "Position",
          helpText: "Sets the icon alignment of a menu item",
          controlType: "ICON_TABS",
          defaultValue: "left",
          fullWidth: false,
          options: [
            {
              startIcon: "skip-left-line",
              value: "left",
            },
            {
              startIcon: "skip-right-line",
              value: "right",
            },
          ],
          isBindProperty: false,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
      ],
    },
    {
      sectionName: "Color",
      children: [
        {
          propertyName: "iconColor",
          helpText: "Sets the icon color of a menu item",
          label: "Icon color",
          controlType: "COLOR_PICKER",
          isBindProperty: false,
          isTriggerProperty: false,
        },
        {
          propertyName: "textColor",
          helpText: "Sets the text color of a menu item",
          label: "Text color",
          controlType: "COLOR_PICKER",
          isBindProperty: false,
          isTriggerProperty: false,
        },
        {
          propertyName: "backgroundColor",
          helpText: "Sets the background color of a menu item",
          label: "Background color",
          controlType: "COLOR_PICKER",
          isBindProperty: false,
          isTriggerProperty: false,
        },
      ],
    },
  ],
};
