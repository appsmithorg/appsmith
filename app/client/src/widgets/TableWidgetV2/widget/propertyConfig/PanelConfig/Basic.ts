import { ValidationTypes } from "constants/WidgetValidation";
import {
  ColumnTypes,
  ICON_NAMES,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import { hideByColumnType, updateIconAlignment } from "../../propertyUtils";
import { IconNames } from "@blueprintjs/icons";
import {
  // MenuButtonWidgetProps,
  MenuItemsSource,
} from "widgets/MenuButtonWidget/constants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { getAutocompleteProperties } from "widgets/MenuButtonWidget/widget/helper";

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
        type: ValidationTypes.TABLE_PROPERTY,
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
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        // if (props.menuItemsSource === MenuItemsSource.DYNAMIC) {
        //   return false;
        // }

        return hideByColumnType(
          props,
          propertyPath,
          [ColumnTypes.MENU_BUTTON],
          false,
        );
      },
      dependencies: ["primaryColumns", "columnOrder", "menuItemsSource"],
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
                helpText: "Triggers an action when the menu item is clicked",
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
                  type: ValidationTypes.TABLE_PROPERTY,
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
                  type: ValidationTypes.TABLE_PROPERTY,
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
                  type: ValidationTypes.TABLE_PROPERTY,
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
                  type: ValidationTypes.TABLE_PROPERTY,
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
      helpText: "Takes in an array of items to display the menu items.",
      propertyName: "sourceData",
      label: "Source Data",
      controlType: "INPUT_TEXT",
      placeholderText: "{{Table1.tableData}}",
      inputType: "ARRAY",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.ARRAY },
      evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      // hidden: (props: MenuButtonWidgetProps) =>
      //   props.menuItemsSource === MenuItemsSource.STATIC,
      dependencies: ["menuItemsSource"],
    },
    {
      helpText: "Configure Menu Items",
      propertyName: "configureMenuItems",
      controlType: "CONFIGURE_MENU_ITEMS",
      label: "Configure Menu Items",
      isBindProperty: false,
      isTriggerProperty: false,
      // hidden: (props: MenuButtonWidgetProps) =>
      //   props.menuItemsSource === MenuItemsSource.STATIC || !props.sourceData,
      dependencies: [
        "primaryColumns",
        "columnOrder",
        "menuItemsSource",
        "sourceData",
      ],
      panelConfig: {
        editableTitle: false,
        titlePropertyName: "label",
        panelIdPropertyName: "id",
        dependencies: [
          "primaryColumns",
          "columnOrder",
          "menuItemsSource",
          "sourceData",
        ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
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
                dependencies: [
                  "primaryColumns",
                  "columnOrder",
                  "sourceDataKeys",
                ],
              },
            ],
          },
        ],
      },
    },
    {
      helpText: "Triggers an action when the button is clicked",
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
