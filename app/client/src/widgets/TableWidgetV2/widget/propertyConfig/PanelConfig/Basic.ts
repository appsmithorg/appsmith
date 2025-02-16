import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes, ICON_NAMES } from "widgets/TableWidgetV2/constants";
import {
  hideByColumnType,
  hideByMenuItemsSource,
  hideIfMenuItemsSourceDataIsFalsy,
  updateIconAlignment,
  updateMenuItemsSource,
} from "../../propertyUtils";
import { IconNames } from "@blueprintjs/icons";
import { MenuItemsSource } from "widgets/MenuButtonWidget/constants";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import configureMenuItemsConfig from "./childPanels/configureMenuItemsConfig";

export default {
  sectionName: "Basic",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.BUTTON, ColumnTypes.ICON_BUTTON, ColumnTypes.MENU_BUTTON],
      true,
    );
  },
  children: [
    {
      propertyName: "iconName",
      label: "Icon",
      helpText: "Sets the icon to be used for the icon button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.ICON_BUTTON]);
      },
      updateHook: updateIconAlignment,
      dependencies: ["primaryColumns", "columnOrder"],
      controlType: "ICON_SELECT",
      customJSControl: "TABLE_COMPUTE_VALUE",
      defaultIconName: "add",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
            default: IconNames.ADD,
          },
        },
      },
    },
    {
      propertyName: "buttonLabel",
      label: "Text",
      helpText: "Sets the label of the button",
      controlType: "TABLE_COMPUTE_VALUE",
      defaultValue: "Action",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "menuButtonLabel",
      label: "Text",
      helpText: "Sets the label of the button",
      controlType: "TABLE_COMPUTE_VALUE",
      defaultValue: "Open Menu",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "menuItemsSource",
      helpText: "Sets the source for the menu items",
      label: "Menu items source",
      controlType: "ICON_TABS",
      fullWidth: true,
      defaultValue: MenuItemsSource.STATIC,
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
      dependencies: [
        "primaryColumns",
        "columnOrder",
        "sourceData",
        "configureMenuItems",
      ],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.MENU_BUTTON],
          false,
        );
      },
    },
    {
      helpText: "Takes in an array of items to display the menu items.",
      propertyName: "sourceData",
      label: "Source data",
      controlType: "TABLE_COMPUTE_VALUE",
      placeholderText: "{{Query1.data}}",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY,
        params: {
          required: true,
          default: [],
          children: {
            type: ValidationTypes.ARRAY,
            params: {
              required: true,
              default: [],
              children: {
                type: ValidationTypes.UNION,
                params: {
                  required: true,
                  types: [
                    {
                      type: ValidationTypes.TEXT,
                      params: {
                        required: true,
                      },
                    },
                    {
                      type: ValidationTypes.NUMBER,
                      params: {
                        required: true,
                      },
                    },
                    {
                      type: ValidationTypes.OBJECT,
                      params: {
                        required: true,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return (
          hideByColumnType(
            props,
            propertyPath,
            [ColumnTypes.MENU_BUTTON],
            false,
          ) ||
          hideByMenuItemsSource(props, propertyPath, MenuItemsSource.STATIC)
        );
      },
      dependencies: ["primaryColumns", "columnOrder", "menuItemsSource"],
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
      hidden: (props: TableWidgetProps, propertyPath: string) =>
        hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.MENU_BUTTON],
          false,
        ) ||
        hideIfMenuItemsSourceDataIsFalsy(props, propertyPath) ||
        hideByMenuItemsSource(props, propertyPath, MenuItemsSource.STATIC),
      dependencies: [
        "primaryColumns",
        "columnOrder",
        "menuItemsSource",
        "sourceData",
      ],
      panelConfig: configureMenuItemsConfig,
    },
    {
      helpText: "Menu items",
      propertyName: "menuItems",
      controlType: "MENU_ITEMS",
      label: "Menu items",
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return (
          hideByColumnType(
            props,
            propertyPath,
            [ColumnTypes.MENU_BUTTON],
            false,
          ) ||
          hideByMenuItemsSource(props, propertyPath, MenuItemsSource.DYNAMIC)
        );
      },
      dependencies: ["primaryColumns", "columnOrder"],
      panelConfig: {
        editableTitle: true,
        titlePropertyName: "label",
        panelIdPropertyName: "id",
        dependencies: ["primaryColumns", "columnOrder"],
        contentChildren: [
          {
            sectionName: "Basic",
            children: [
              {
                propertyName: "label",
                helpText: "Sets the label of a menu item",
                label: "Text",
                controlType: "INPUT_TEXT",
                placeholderText: "Enter label",
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
                dependencies: ["primaryColumns", "columnOrder"],
              },
              {
                helpText: "when the menu item is clicked",
                propertyName: "onClick",
                label: "onClick",
                controlType: "ACTION_SELECTOR",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: true,
                dependencies: ["primaryColumns", "columnOrder"],
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
                customJSControl: "TABLE_COMPUTE_VALUE",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: {
                  type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
                  params: {
                    type: ValidationTypes.BOOLEAN,
                  },
                },
                dependencies: ["primaryColumns", "columnOrder"],
              },
              {
                propertyName: "isDisabled",
                helpText: "Disables input to the widget",
                label: "Disabled",
                controlType: "SWITCH",
                customJSControl: "TABLE_COMPUTE_VALUE",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: {
                  type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
                  params: {
                    type: ValidationTypes.BOOLEAN,
                  },
                },
                dependencies: ["primaryColumns", "columnOrder"],
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
                dependencies: ["primaryColumns", "columnOrder"],
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
                dependencies: ["primaryColumns", "columnOrder"],
              },
            ],
          },
          {
            sectionName: "Color",
            children: [
              {
                propertyName: "textColor",
                helpText: "Sets the text color of a menu item",
                label: "Text color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                customJSControl: "TABLE_COMPUTE_VALUE",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
                validation: {
                  type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
                  params: {
                    type: ValidationTypes.TEXT,
                    params: {
                      regex: /^(?![<|{{]).+/,
                    },
                  },
                },
              },
              {
                propertyName: "backgroundColor",
                helpText: "Sets the background color of a menu item",
                label: "Background color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                customJSControl: "TABLE_COMPUTE_VALUE",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
                validation: {
                  type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
                  params: {
                    type: ValidationTypes.TEXT,
                    params: {
                      regex: /^(?![<|{{]).+/,
                    },
                  },
                },
              },
              {
                propertyName: "iconColor",
                helpText: "Sets the icon color of a menu item",
                label: "Icon color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                isBindProperty: false,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
              },
            ],
          },
        ],
      },
    },
    {
      helpText: "when the button is clicked",
      propertyName: "onClick",
      label: "onClick",
      controlType: "ACTION_SELECTOR",
      additionalAutoComplete: (props: TableWidgetProps) => ({
        currentRow: Object.assign(
          {},
          ...Object.keys(props.primaryColumns).map((key) => ({
            [key]: "",
          })),
        ),
      }),
      isJSConvertible: true,
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: true,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.BUTTON,
          ColumnTypes.ICON_BUTTON,
        ]);
      },
    },
  ],
};
