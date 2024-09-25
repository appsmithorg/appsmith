import { ValidationTypes } from "constants/WidgetValidation";
import { getKeysFromSourceDataForEventAutocomplete } from "../../helper";
import type { MenuButtonWidgetProps } from "modules/ui-builder/ui/wds/WDSMenuButtonWidget/widget/types";

/**
 * This is for the configuration of menu items when
 * the menuItemsSource is dynamic.
 */
export const configureMenuItemsConfig = {
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
            "when the menu item is clicked. Can also be configured the using {{currentItem}} binding.",
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
    // TODO - Uncomment once we have
    // 1. polished the fundamentals of WDS - https://theappsmith.slack.com/archives/C04P60V0VQE/p1701435055352789?thread_ts=1701429043.543219&cid=C04P60V0VQE
    // 2. added icon support in the Item component - https://theappsmith.slack.com/archives/C04P60V0VQE/p1701764785966839?thread_ts=1701071080.561509&cid=C04P60V0VQE
    //   {
    //     sectionName: "Icon",
    //     children: [
    //       {
    //         propertyName: "iconName",
    //         label: "Icon",
    //         helpText:
    //           "Sets the icon to be used for a menu item. Can also be configured the using {{currentItem}} binding.",
    //         controlType: "ICON_SELECT",
    //         isBindProperty: true,
    //         isTriggerProperty: false,
    //         isJSConvertible: true,
    //         validation: {
    //           type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
    //           params: {
    //             type: ValidationTypes.TEXT,
    //             params: {
    //               allowedValues: ICON_NAMES,
    //             },
    //           },
    //         },
    //         customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
    //         evaluatedDependencies: ["sourceData"],
    //       },
    //       {
    //         propertyName: "iconAlign",
    //         label: "Position",
    //         helpText:
    //           "Sets the icon alignment of a menu item. Can also be configured the using {{currentItem}} binding.",
    //         controlType: "ICON_TABS",
    //         fullWidth: false,
    //         options: [
    //           {
    //             startIcon: "skip-left-line",
    //             value: "start",
    //           },
    //           {
    //             startIcon: "skip-right-line",
    //             value: "end",
    //           },
    //         ],
    //         isBindProperty: true,
    //         isTriggerProperty: false,
    //         isJSConvertible: true,
    //         validation: {
    //           type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
    //           params: {
    //             type: ValidationTypes.TEXT,
    //             params: {
    //               allowedValues: ["start", "end"],
    //             },
    //           },
    //         },
    //         customJSControl: "MENU_BUTTON_DYNAMIC_ITEMS",
    //         evaluatedDependencies: ["sourceData"],
    //       },
    //     ],
    //   },
    //   {
    //     sectionName: "Color",
    //     children: [
    //       {
    //         propertyName: "textColor",
    //         label: "Text Color",
    //         helpText: "Controls the color of the text displayed",
    //         controlType: "DROP_DOWN",
    //         defaultValue: "neutral",
    //         options: [
    //           {
    //             label: "Accent",
    //             value: "accent",
    //           },
    //           {
    //             label: "Neutral",
    //             value: "neutral",
    //           },
    //           {
    //             label: "Positive",
    //             value: "positive",
    //           },
    //           {
    //             label: "Negative",
    //             value: "negative",
    //           },
    //           {
    //             label: "Warning",
    //             value: "warning",
    //           },
    //         ],
    //         isJSConvertible: true,
    //         isBindProperty: true,
    //         isTriggerProperty: false,
    //         validation: {
    //           type: ValidationTypes.TEXT,
    //           params: {
    //             allowedValues: Object.values(COLORS),
    //             default: COLORS.neutral,
    //           },
    //         },
    //       },
    //     ],
    //   },
  ],
};
