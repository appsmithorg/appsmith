import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/wds/WDSTableWidget/constants";
import { hideByColumnType, showByColumnType } from "../../propertyUtils";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";

export default {
  sectionName: "Text formatting",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return showByColumnType(
      props,
      propertyPath,
      [ColumnTypes.CHECKBOX, ColumnTypes.SWITCH],
      true,
    );
  },
  children: [
    {
      propertyName: "textSize",
      label: "Text size",
      helpText: "Controls the size of text in the column",
      controlType: "DROP_DOWN",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      options: [
        {
          label: "S",
          value: "0.875rem",
          subText: "0.875rem",
        },
        {
          label: "M",
          value: "1rem",
          subText: "1rem",
        },
        {
          label: "L",
          value: "1.25rem",
          subText: "1.25rem",
        },
        {
          label: "XL",
          value: "1.875rem",
          subText: "1.875rem",
        },
      ],
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.CURRENCY,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "fontStyle",
      label: "Emphasis",
      helpText: "Controls the style of the text in the column",
      controlType: "BUTTON_GROUP",
      options: [
        {
          icon: "text-bold",
          value: "BOLD",
        },
        {
          icon: "text-italic",
          value: "ITALIC",
        },
        {
          icon: "text-underline",
          value: "UNDERLINE",
        },
      ],
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.CURRENCY,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "horizontalAlignment",
      label: "Text align",
      helpText: "Sets the horizontal alignment of the content in the column",
      controlType: "ICON_TABS",
      fullWidth: true,
      options: [
        {
          startIcon: "align-left",
          value: "LEFT",
        },
        {
          startIcon: "align-center",
          value: "CENTER",
        },
        {
          startIcon: "align-right",
          value: "RIGHT",
        },
      ],
      defaultValue: "LEFT",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["LEFT", "CENTER", "RIGHT"],
          },
        },
      },
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.CURRENCY,
          ColumnTypes.URL,
          ColumnTypes.CHECKBOX,
          ColumnTypes.SWITCH,
        ]);
      },
    },
    {
      propertyName: "verticalAlignment",
      label: "Vertical alignment",
      helpText: "Sets the vertical alignment of the content in the column",
      controlType: "ICON_TABS",
      fullWidth: true,
      options: [
        {
          startIcon: "vertical-align-top",
          value: "TOP",
        },
        {
          startIcon: "vertical-align-middle",
          value: "CENTER",
        },
        {
          startIcon: "vertical-align-bottom",
          value: "BOTTOM",
        },
      ],
      defaultValue: "CENTER",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["TOP", "CENTER", "BOTTOM"],
          },
        },
      },
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.CURRENCY,
          ColumnTypes.URL,
          ColumnTypes.CHECKBOX,
          ColumnTypes.SWITCH,
        ]);
      },
    },
  ],
};
