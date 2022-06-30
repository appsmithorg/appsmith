import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "../../propertyUtils";

export default {
  sectionName: "Menu Items",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.MENU_BUTTON],
      true,
    );
  },
  children: [
    {
      helpText: "Menu items",
      propertyName: "menuItems",
      controlType: "MENU_ITEMS",
      label: "",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: ["columnOrder"],
      panelConfig: {
        editableTitle: true,
        titlePropertyName: "label",
        panelIdPropertyName: "id",
        dependencies: ["primaryColumns", "columnOrder"],
        children: [
          {
            sectionName: "General",
            children: [
              {
                propertyName: "label",
                helpText: "Sets the label of a menu item",
                label: "Label",
                controlType: "INPUT_TEXT",
                placeholderText: "Enter label",
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
                dependencies: ["primaryColumns", "columnOrder"],
              },
              {
                propertyName: "backgroundColor",
                helpText: "Sets the background color of a menu item",
                label: "Background color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
                validation: { type: ValidationTypes.TEXT },
              },
              {
                propertyName: "textColor",
                helpText: "Sets the text color of a menu item",
                label: "Text color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                isBindProperty: false,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
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
                dependencies: ["primaryColumns", "columnOrder"],
              },
              {
                propertyName: "isVisible",
                helpText: "Controls the visibility of the widget",
                label: "Visible",
                controlType: "SWITCH",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.BOOLEAN },
                dependencies: ["primaryColumns", "columnOrder"],
              },
            ],
          },
          {
            sectionName: "Icon Options",
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
                propertyName: "iconColor",
                helpText: "Sets the icon color of a menu item",
                label: "Icon color",
                controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
                isBindProperty: false,
                isTriggerProperty: false,
                dependencies: ["primaryColumns", "columnOrder"],
              },
              {
                propertyName: "iconAlign",
                label: "Icon alignment",
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
            sectionName: "Events",
            children: [
              {
                helpText: "Triggers an action when the menu item is clicked",
                propertyName: "onClick",
                label: "onItemClick",
                controlType: "ACTION_SELECTOR",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: true,
                dependencies: ["primaryColumns", "columnOrder"],
              },
            ],
          },
        ],
      },
    },
  ],
};
