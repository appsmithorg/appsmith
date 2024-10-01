import { get } from "lodash";
import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { hideByColumnType, getBasePropertyPath } from "../../propertyUtils";
import { ButtonVariantTypes } from "components/constants";
import { ICON_NAMES } from "WidgetProvider/constants";

export default {
  sectionName: "Save Button",
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
          propertyName: "saveActionLabel",
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
          propertyName: "onSave",
          label: "onSave",
          helpText: "when the save button is clicked",
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
          propertyName: "isSaveVisible",
          dependencies: ["primaryColumns"],
          label: "Visible",
          helpText: "Controls the visibility of the save button",
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
          propertyName: "isSaveDisabled",
          label: "Disabled",
          helpText: "Disables clicks to the save button",
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

export const saveButtonStyleConfig = {
  sectionName: "Save Button",
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
          propertyName: "saveButtonColor",
          label: "Button color",
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
          propertyName: "saveButtonVariant",
          label: "Button variant",
          controlType: "ICON_TABS",
          fullWidth: true,
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText: "Sets the variant of the save button",
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
          propertyName: "saveBorderRadius",
          label: "Border radius",
          customJSControl: "TABLE_COMPUTE_VALUE",
          isJSConvertible: true,
          helpText: "Rounds the corners of the save button's outer border edge",
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
          propertyName: "saveActionIconName",
          label: "Icon",
          helpText: "Sets the icon to be used for the save action button",
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
          propertyName: "saveIconAlign",
          label: "Position",
          helpText: "Sets the icon alignment of the save button",
          controlType: "ICON_TABS",
          fullWidth: false,
          defaultValue: "left",
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
