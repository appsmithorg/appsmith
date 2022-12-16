import { get } from "lodash";
import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType, getBasePropertyPath } from "../../propertyUtils";
import { ButtonVariantTypes } from "components/constants";
import { ICON_NAMES } from "widgets/constants";

export default {
  sectionName: "Discard Button",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.EDIT_ACTIONS],
      true,
    );
  },
  children: [
    {
      sectionName: "Label",
      collapsible: false,
      children: [
        {
          propertyName: "discardActionLabel",
          label: "Text",
          helpText: "Sets the label text of the button",
          controlType: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns"],
          isBindProperty: true,
          isTriggerProperty: false,
        },
      ],
    },
    {
      sectionName: "General",
      collapsible: false,
      children: [
        {
          propertyName: "onDiscard",
          label: "onDiscard",
          helpText: "Triggers an action when the discard button is clicked",
          controlType: "ACTION_SELECTOR",
          hidden: (props: TableWidgetProps, propertyPath: string) => {
            const baseProperty = getBasePropertyPath(propertyPath);
            const columnType = get(props, `${baseProperty}.columnType`, "");
            return columnType !== ColumnTypes.EDIT_ACTIONS;
          },
          dependencies: ["primaryColumns"],
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
        {
          propertyName: "isDiscardVisible",
          dependencies: ["primaryColumns"],
          label: "Visible",
          helpText: "Controls the visibility of the discard button",
          defaultValue: true,
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
        },
        {
          propertyName: "isDiscardDisabled",
          label: "Disabled",
          helpText: "Disables clicks to the discard button",
          defaultValue: false,
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
          dependencies: ["primaryColumns"],
        },
      ],
    },
  ],
};

export const discardButtonStyleConfig = {
  sectionName: "Discard Button",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.EDIT_ACTIONS],
      true,
    );
  },
  children: [
    {
      sectionName: "General",
      collapsible: false,
      children: [
        {
          propertyName: "discardButtonColor",
          label: "Button Color",
          controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
          helpText: "Changes the color of the button",
          isJSConvertible: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          dependencies: ["primaryColumns"],
          isBindProperty: true,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
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
          propertyName: "discardButtonVariant",
          label: "Button Variant",
          controlType: "ICON_TABS",
          fullWidth: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText: "Sets the variant of the discard button",
          dependencies: ["primaryColumns"],
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
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
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
          propertyName: "discardBorderRadius",
          label: "Border Radius",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText:
            "Rounds the corners of the discard button's outer border edge",
          controlType: "BORDER_RADIUS_OPTIONS",
          dependencies: ["primaryColumns"],
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
            },
          },
        },
      ],
    },
    {
      sectionName: "Icon",
      collapsible: false,
      children: [
        {
          propertyName: "discardActionIconName",
          label: "Icon",
          helpText: "Sets the icon to be used for the discard action button",
          dependencies: ["primaryColumns", "columnOrder"],
          controlType: "ICON_SELECT",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
            params: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ICON_NAMES,
              },
            },
          },
        },
        {
          propertyName: "discardIconAlign",
          label: "Position",
          helpText: "Sets the icon alignment of the discard button",
          controlType: "ICON_TABS",
          fullWidth: true,
          defaultValue: "left",
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
          dependencies: ["primaryColumns"],
          validation: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: ["left", "right"],
            },
          },
        },
      ],
    },
  ],
};
