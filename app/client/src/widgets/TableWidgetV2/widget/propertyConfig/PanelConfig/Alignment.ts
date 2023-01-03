import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
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
          icon: "LEFT_ALIGN",
          value: "LEFT",
        },
        {
          icon: "CENTER_ALIGN",
          value: "CENTER",
        },
        {
          icon: "RIGHT_ALIGN",
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
          icon: "VERTICAL_TOP",
          value: "TOP",
        },
        {
          icon: "VERTICAL_CENTER",
          value: "CENTER",
        },
        {
          icon: "VERTICAL_BOTTOM",
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
