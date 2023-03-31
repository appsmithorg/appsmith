import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "../../propertyUtils";

export default {
  sectionName: "Alignment",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.CHECKBOX, ColumnTypes.SWITCH],
      true,
    );
  },
  children: [
    {
      propertyName: "horizontalAlignment",
      label: "Horizontal Alignment",
      helpText: "Sets the horizontal alignment of the content in the column",
      controlType: "ICON_TABS",
      options: [
        {
          startIcon: "left-align",
          value: "LEFT",
        },
        {
          startIcon: "left-align",
          value: "CENTER",
        },
        {
          startIcon: "right-align",
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
          ColumnTypes.URL,
          ColumnTypes.CHECKBOX,
          ColumnTypes.SWITCH,
        ]);
      },
    },
    {
      propertyName: "verticalAlignment",
      label: "Vertical Alignment",
      helpText: "Sets the vertical alignment of the content in the column",
      controlType: "ICON_TABS",
      options: [
        {
          startIcon: "arrow-left-s-line",
          value: "TOP",
        },
        {
          startIcon: "arrow-left-s-line",
          value: "CENTER",
        },
        {
          startIcon: "arrow-right-s-line",
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
          ColumnTypes.URL,
          ColumnTypes.CHECKBOX,
          ColumnTypes.SWITCH,
        ]);
      },
    },
  ],
};
