import { ValidationTypes } from "constants/WidgetValidation";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { MenuItemsSource, MenuButtonWidgetProps } from "../../constants";
import { getAutocompleteProperties } from "../helper";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { arrayOfValuesWithMaxLengthTen } from "widgets/MenuButtonWidget/validations";

export default [
  {
    sectionName: "Basic",
    children: [
      {
        propertyName: "label",
        helpText: "Sets the label of a menu",
        label: "Label",
        controlType: "INPUT_TEXT",
        placeholderText: "Open",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "menuItemsSource",
        helpText: "Sets the source for the menu items",
        label: "Menu Items Source",
        controlType: "DROP_DOWN",
        options: [
          {
            label: "Static",
            value: MenuItemsSource.STATIC,
          },
          {
            label: "Dynamic",
            value: MenuItemsSource.DYNAMIC,
          },
        ],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Menu items",
        propertyName: "menuItems",
        controlType: "MENU_ITEMS",
        label: "Menu Items",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: MenuButtonWidgetProps) =>
          props.menuItemsSource === MenuItemsSource.DYNAMIC,
        dependencies: ["menuItemsSource"],
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: (
            props: any,
            propertyPath: string,
            propertyValue: string,
          ) => {
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
                  helpText: "Triggers an action when the menu item is clicked",
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
        },
      },
      {
        helpText: "Takes in an array of items to display the menu items.",
        propertyName: "sourceData",
        label: "Source Data",
        controlType: "INPUT_TEXT",
        placeholderText: "{{Table1.tableData}}",
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: arrayOfValuesWithMaxLengthTen,
            expected: {
              type: "Array of values",
              example: `['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
              autocompleteDataType: AutocompleteDataType.ARRAY,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        hidden: (props: MenuButtonWidgetProps) =>
          props.menuItemsSource === MenuItemsSource.STATIC,
        dependencies: ["menuItemsSource"],
      },
      {
        helpText: "Configure Menu Items",
        propertyName: "configureMenuItems",
        controlType: "CONFIGURE_MENU_ITEMS",
        label: "Configure Menu Items",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: MenuButtonWidgetProps) =>
          props.menuItemsSource === MenuItemsSource.STATIC || !props.sourceData,
        dependencies: ["menuItemsSource", "sourceData"],
        panelConfig: {
          editableTitle: false,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: (
            props: any,
            propertyPath: string,
            propertyValue: string,
          ) => {
            return [
              {
                propertyPath,
                propertyValue,
              },
            ];
          },
          contentChildren: [
            {
              sectionName: "General",
              children: [
                {
                  propertyName: "label",
                  helpText: "Sets the label of a menu item",
                  label: "Label",
                  controlType: "MENU_COMPUTE_VALUE",
                  placeholderText: "{{currentItem.name}}",
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.MENU_PROPERTY,
                    params: {
                      type: ValidationTypes.TEXT,
                    },
                  },
                  dependencies: ["sourceDataKeys"],
                },
                {
                  propertyName: "isVisible",
                  helpText: "Controls the visibility of the widget",
                  label: "Visible",
                  controlType: "SWITCH",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.MENU_PROPERTY,
                    params: {
                      type: ValidationTypes.BOOLEAN,
                    },
                  },
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
                {
                  propertyName: "isDisabled",
                  helpText: "Disables input to the widget",
                  label: "Disabled",
                  controlType: "SWITCH",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.MENU_PROPERTY,
                    params: {
                      type: ValidationTypes.BOOLEAN,
                    },
                  },
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
              ],
            },
            {
              sectionName: "Events",
              children: [
                {
                  helpText: "Triggers an action when the menu item is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: true,
                  additionalAutoComplete: getAutocompleteProperties,
                  dependencies: ["sourceDataKeys"],
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
                  isJSConvertible: true,
                  validation: { type: ValidationTypes.TEXT },
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
                {
                  propertyName: "iconAlign",
                  label: "Position",
                  helpText: "Sets the icon alignment of a menu item",
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
                  isBindProperty: false,
                  isTriggerProperty: false,
                  isJSConvertible: true,
                  validation: { type: ValidationTypes.TEXT },
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
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
                  isJSConvertible: true,
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
                {
                  propertyName: "backgroundColor",
                  helpText: "Sets the background color of a menu item",
                  label: "Background color",
                  controlType: "COLOR_PICKER",
                  isBindProperty: false,
                  isTriggerProperty: false,
                  isJSConvertible: true,
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
                {
                  propertyName: "textColor",
                  helpText: "Sets the text color of a menu item",
                  label: "Text color",
                  controlType: "COLOR_PICKER",
                  isBindProperty: false,
                  isTriggerProperty: false,
                  isJSConvertible: true,
                  customJSControl: "MENU_COMPUTE_VALUE",
                  dependencies: ["sourceDataKeys"],
                },
              ],
            },
          ],
        },
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
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "isCompact",
        helpText: "Decides if menu items will consume lesser space",
        label: "Compact",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
] as PropertyPaneConfig[];
