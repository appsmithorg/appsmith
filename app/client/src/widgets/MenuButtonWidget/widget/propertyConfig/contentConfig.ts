import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { sourceDataArrayValidation } from "widgets/MenuButtonWidget/validations";
import type { MenuButtonWidgetProps } from "../../constants";
import { MenuItemsSource } from "../../constants";
import configureMenuItemsConfig from "./childPanels/configureMenuItemsConfig";
import menuItemsConfig from "./childPanels/menuItemsConfig";
import { updateMenuItemsSource } from "./propertyUtils";
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
        label: "Menu items source",
        controlType: "ICON_TABS",
        defaultValue: MenuItemsSource.STATIC,
        fullWidth: true,
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
        updateHook: updateMenuItemsSource,
        dependencies: ["sourceData", "configureMenuItems"],
      },
      {
        helpText: "Menu items",
        propertyName: "menuItems",
        controlType: "MENU_ITEMS",
        label: "Menu items",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: MenuButtonWidgetProps) =>
          props.menuItemsSource === MenuItemsSource.DYNAMIC,
        dependencies: ["menuItemsSource"],
        panelConfig: menuItemsConfig,
      },
      {
        helpText: "Takes in an array of items to display the menu items.",
        propertyName: "sourceData",
        label: "Source data",
        controlType: "INPUT_TEXT",
        placeholderText: "{{Query1.data}}",
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: sourceDataArrayValidation,
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
        helpText: "Configure how each menu item will appear.",
        propertyName: "configureMenuItems",
        controlType: "OPEN_CONFIG_PANEL",
        buttonConfig: {
          label: "Configure",
          icon: "settings-v3",
        },
        label: "Configure menu items",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: MenuButtonWidgetProps) =>
          props.menuItemsSource === MenuItemsSource.STATIC || !props.sourceData,
        dependencies: ["menuItemsSource", "sourceData"],
        panelConfig: configureMenuItemsConfig,
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
        label: "Animate loading",
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
