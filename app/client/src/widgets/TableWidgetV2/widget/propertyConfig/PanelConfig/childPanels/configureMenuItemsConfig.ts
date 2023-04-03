import { ValidationTypes } from "constants/WidgetValidation";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { ICON_NAMES } from "widgets/MenuButtonWidget/constants";
import {
  booleanForEachRowValidation,
  colorForEachRowValidation,
  iconNamesForEachRowValidation,
  iconPositionForEachRowValidation,
  textForEachRowValidation,
} from "widgets/MenuButtonWidget/validations";
import { getSourceDataAndCaluclateKeysForEventAutoComplete } from "widgets/TableWidgetV2/widget/utilities";

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
            type: ValidationTypes.FUNCTION,
            params: {
              expected: {
                type: "Array of values",
                example: `['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
                autocompleteDataType: AutocompleteDataType.ARRAY,
              },
              fnString: textForEachRowValidation.toString(),
            },
          },
          evaluatedDependencies: ["primaryColumns"],
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
            type: ValidationTypes.FUNCTION,
            params: {
              fnString: booleanForEachRowValidation.toString(),
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["primaryColumns"],
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
            type: ValidationTypes.FUNCTION,
            params: {
              fnString: booleanForEachRowValidation.toString(),
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["primaryColumns"],
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
          additionalAutoComplete:
            getSourceDataAndCaluclateKeysForEventAutoComplete,
          evaluatedDependencies: ["primaryColumns"],
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
            type: ValidationTypes.FUNCTION,
            params: {
              allowedValues: ICON_NAMES,
              fnString: iconNamesForEachRowValidation.toString(),
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["primaryColumns"],
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
            type: ValidationTypes.FUNCTION,
            params: {
              allowedValues: ["center", "left", "right"],
              fnString: iconPositionForEachRowValidation.toString(),
            },
          },
          customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
          evaluatedDependencies: ["primaryColumns"],
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
          evaluatedDependencies: ["primaryColumns"],
          validation: {
            type: ValidationTypes.FUNCTION,
            params: {
              regex: /^(?![<|{{]).+/,
              fnString: colorForEachRowValidation.toString(),
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
          evaluatedDependencies: ["primaryColumns"],
          validation: {
            type: ValidationTypes.FUNCTION,
            params: {
              regex: /^(?![<|{{]).+/,
              fnString: colorForEachRowValidation.toString(),
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
          evaluatedDependencies: ["primaryColumns"],
          validation: {
            type: ValidationTypes.FUNCTION,
            params: {
              regex: /^(?![<|{{]).+/,
              fnString: colorForEachRowValidation.toString(),
            },
          },
        },
      ],
    },
  ],
};
