import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ButtonVariantTypes } from "components/constants";
import {
  hideByColumnType,
  removeBoxShadowColorProp,
  updateIconAlignment,
} from "../../propertyUtils";
import { IconNames } from "@blueprintjs/icons";

const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export default {
  sectionName: "Button Properties",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.BUTTON, ColumnTypes.MENU_BUTTON, ColumnTypes.ICON_BUTTON],
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
      customJSControl: "COMPUTE_VALUE_V2",
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
      propertyName: "menuButtoniconName",
      label: "Icon",
      helpText: "Sets the icon to be used for the menu button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      updateHook: updateIconAlignment,
      dependencies: ["primaryColumns", "columnOrder"],
      controlType: "ICON_SELECT",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
          },
        },
      },
    },
    {
      propertyName: "iconAlign",
      label: "Icon Alignment",
      helpText: "Sets the icon alignment of the menu button",
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
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["center", "left", "right"],
        },
      },
    },
    {
      propertyName: "buttonLabel",
      label: "Label",
      controlType: "COMPUTE_VALUE_V2",
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
      label: "Label",
      controlType: "COMPUTE_VALUE_V2",
      defaultValue: "Open Menu",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "buttonColor",
      label: "Button Color",
      controlType: "COLOR_PICKER",
      helpText: "Changes the color of the button",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.BUTTON,
          ColumnTypes.ICON_BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            regex: /^(?![<|{{]).+/,
          },
        },
      },
      isTriggerProperty: false,
    },
    {
      propertyName: "buttonVariant",
      label: "Button Variant",
      controlType: "DROP_DOWN",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      helpText: "Sets the variant",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      options: [
        {
          label: "Primary",
          value: ButtonVariantTypes.PRIMARY,
        },
        {
          label: "Secondary",
          value: ButtonVariantTypes.SECONDARY,
        },
        {
          label: "Tertiary",
          value: ButtonVariantTypes.TERTIARY,
        },
      ],
      defaultValue: ButtonVariantTypes.PRIMARY,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            default: ButtonVariantTypes.PRIMARY,
            allowedValues: [
              ButtonVariantTypes.PRIMARY,
              ButtonVariantTypes.SECONDARY,
              ButtonVariantTypes.TERTIARY,
            ],
          },
        },
      },
    },
    {
      propertyName: "borderRadius",
      label: "Border Radius",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      helpText: "Rounds the corners of the icon button's outer border edge",
      controlType: "BORDER_RADIUS_OPTIONS",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.MENU_BUTTON,
          ColumnTypes.BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
    },
    {
      propertyName: "boxShadow",
      label: "Box Shadow",
      helpText:
        "Enables you to cast a drop shadow from the frame of the widget",
      controlType: "BOX_SHADOW_OPTIONS",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      updateHook: removeBoxShadowColorProp,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.MENU_BUTTON,
          ColumnTypes.BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
    },
    {
      propertyName: "menuColor",
      helpText: "Sets the custom color preset based on the menu button variant",
      label: "Menu Color",
      controlType: "COLOR_PICKER",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            regex: /^(?![<|{{]).+/,
          },
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
    },
    {
      propertyName: "menuVariant",
      label: "Menu Variant",
      controlType: "DROP_DOWN",
      helpText: "Sets the variant of the menu button",
      options: [
        {
          label: "Primary",
          value: ButtonVariantTypes.PRIMARY,
        },
        {
          label: "Secondary",
          value: ButtonVariantTypes.SECONDARY,
        },
        {
          label: "Tertiary",
          value: ButtonVariantTypes.TERTIARY,
        },
      ],
      isJSConvertible: true,
      dependencies: ["primaryColumns", "columnOrder"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          default: ButtonVariantTypes.PRIMARY,
          allowedValues: [
            ButtonVariantTypes.PRIMARY,
            ButtonVariantTypes.SECONDARY,
            ButtonVariantTypes.TERTIARY,
          ],
        },
      },
    },
  ],
};
