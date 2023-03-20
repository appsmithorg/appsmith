import { ValidationTypes } from "constants/WidgetValidation";
import type { MenuButtonWidgetProps } from "../../../constants";
import { ICON_NAMES } from "../../../constants";
import { getKeysFromSourceDataForEventAutocomplete } from "../../helper";

export default {
  editableTitle: false,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  contentChildren: [
    {
      sectionName: "General",
      children: [
        {
          propertyName: "label",
          helpText:
            "Sets the label of a menu item using the {{currentItem}} binding.",
          label: "Label",
          controlType: "MENU_BUTTON_DYNAMIC_ITEMS",
          placeholderText: "{{currentItem.name}}",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
          evaluatedDependencies: ["sourceData"],
        },
        {
          propertyName: "isVisible",
          helpText:
            "Controls the visibility of the widget. Can also be configured the using {{currentItem}} binding.",
          label: "Visible",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
        },
        {
          propertyName: "isDisabled",
          helpText:
            "Disables input to the widget. Can also be configured the using {{currentItem}} binding.",
          label: "Disabled",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
        },
      ],
    },
    {
      sectionName: "Events",
      children: [
        {
          helpText:
            "Triggers an action when the menu item is clicked. Can also be configured the using {{currentItem}} binding.",
          propertyName: "onClick",
          label: "onClick",
          controlType: "ACTION_SELECTOR",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
          additionalAutoComplete: (props: MenuButtonWidgetProps) => {
            return getKeysFromSourceDataForEventAutocomplete(
              props?.__evaluation__?.evaluatedValues?.sourceData,
            );
          },
          evaluatedDependencies: ["sourceData"],
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
          helpText:
            "Sets the icon to be used for a menu item. Can also be configured the using {{currentItem}} binding.",
          controlType: "ICON_SELECT",
          isBindProperty: true,
          isTriggerProperty: false,
          isJSConvertible: true,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ICON_NAMES,
              },
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
        },
        {
          propertyName: "iconAlign",
          label: "Position",
          helpText:
            "Sets the icon alignment of a menu item. Can also be configured the using {{currentItem}} binding.",
          controlType: "ICON_TABS",
          options: [
            {
              icon: "VERTICAL_LEFT",
              value: "left",
            },
            {
              icon: "VERTICAL_RIGHT",
              value: "right",
            },
          ],
          isBindProperty: true,
          isTriggerProperty: false,
          isJSConvertible: true,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["center", "left", "right"],
              },
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
        },
      ],
    },
    {
      sectionName: "Color",
      children: [
        {
          propertyName: "iconColor",
          helpText:
            "Sets the icon color of a menu item. Can also be configured the using {{currentItem}} binding.",
          label: "Icon color",
          controlType: "COLOR_PICKER",
          isBindProperty: true,
          isTriggerProperty: false,
          isJSConvertible: true,
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              regex: /^(?![<|{{]).+/,
            },
          },
        },
        {
          propertyName: "backgroundColor",
          helpText:
            "Sets the background color of a menu item. Can also be configured the using {{currentItem}} binding.",
          label: "Background color",
          controlType: "COLOR_PICKER",
          isBindProperty: true,
          isTriggerProperty: false,
          isJSConvertible: true,
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              regex: /^(?![<|{{]).+/,
            },
          },
        },
        {
          propertyName: "textColor",
          helpText:
            "Sets the text color of a menu item. Can also be configured the using {{currentItem}} binding.",
          label: "Text color",
          controlType: "COLOR_PICKER",
          isBindProperty: true,
          isTriggerProperty: false,
          isJSConvertible: true,
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["sourceData"],
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              regex: /^(?![<|{{]).+/,
            },
          },
        },
      ],
    },
  ],
};
