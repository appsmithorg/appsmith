import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { hideByColumnType, updateIconAlignment } from "../../propertyUtils";
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
      [
        ColumnTypes.BUTTON,
        ColumnTypes.MENU_BUTTON,
        ColumnTypes.ICON_BUTTON,
        ColumnTypes.EDIT_ACTIONS,
      ],
      true,
    );
  },
  children: [
    {
      propertyName: "iconName",
      label: "Icon",
      helpText: "Sets the icon to be used for the icon button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.ICON_BUTTON,
          ColumnTypes.MENU_BUTTON,
        ]);
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
      propertyName: "iconAlign",
      label: "Icon Alignment",
      helpText: "Sets the icon alignment of the menu button",
      controlType: "ICON_ALIGN",
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.MENU_BUTTON,
          ColumnTypes.EDIT_ACTIONS,
        ]);
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
      helpText: "Sets the variant of the icon button",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.ICON_BUTTON]);
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
        return hideByColumnType(props, propertyPath, [ColumnTypes.ICON_BUTTON]);
      },
      options: [
        ButtonBorderRadiusTypes.SHARP,
        ButtonBorderRadiusTypes.ROUNDED,
        ButtonBorderRadiusTypes.CIRCLE,
      ],
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["CIRCLE", "SHARP", "ROUNDED"],
          },
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
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.ICON_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "NONE",
              "VARIANT1",
              "VARIANT2",
              "VARIANT3",
              "VARIANT4",
              "VARIANT5",
            ],
          },
        },
      },
    },
    {
      propertyName: "boxShadowColor",
      helpText: "Sets the shadow color of the widget",
      label: "Shadow Color",
      controlType: "COLOR_PICKER",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.ICON_BUTTON]);
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
      propertyName: "buttonLabelColor",
      label: "Label Color",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
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
      propertyName: "menuColor",
      helpText: "Sets the custom color preset based on the menu button variant",
      label: "Menu Color",
      controlType: "COLOR_PICKER",
      isBindProperty: true,
      isTriggerProperty: false,
      isJSConvertible: true,
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
    {
      propertyName: "borderRadius",
      label: "Border Radius",
      helpText: "Rounds the corners of the icon button's outer border edge",
      controlType: "BUTTON_BORDER_RADIUS_OPTIONS",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: ["primaryColumns", "columnOrder"],
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["CIRCLE", "SHARP", "ROUNDED"],
        },
      },
    },
    {
      propertyName: "boxShadow",
      label: "Box Shadow",
      helpText:
        "Enables you to cast a drop shadow from the frame of the widget",
      controlType: "BOX_SHADOW_OPTIONS",
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: [
            "NONE",
            "VARIANT1",
            "VARIANT2",
            "VARIANT3",
            "VARIANT4",
            "VARIANT5",
          ],
        },
      },
    },
    {
      propertyName: "boxShadowColor",
      helpText: "Sets the shadow color of the widget",
      label: "Shadow Color",
      controlType: "COLOR_PICKER",
      isBindProperty: false,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          regex: /^(?![<|{{]).+/,
        },
      },
    },
    {
      propertyName: "saveActionLabel",
      label: "Save action label",
      controlType: "COMPUTE_VALUE_V2",
      defaultValue: "Save",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "discardActionLabel",
      label: "Discard action label",
      controlType: "COMPUTE_VALUE_V2",
      defaultValue: "Discard",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
  ],
};
