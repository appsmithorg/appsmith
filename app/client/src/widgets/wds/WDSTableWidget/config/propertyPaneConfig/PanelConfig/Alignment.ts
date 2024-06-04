import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/wds/WDSTableWidget/constants";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";
import { hideByColumnType } from "../../../widget/propertyUtils";

export default {
  sectionName: "Alignment",
  children: [
    {
      propertyName: "horizontalAlignment",
      label: "Horizontal Alignment",
      helpText: "Sets the horizontal alignment of the content in the column",
      controlType: "ICON_TABS",
      options: [
        {
          startIcon: "align-left",
          value: "start",
        },
        {
          startIcon: "align-center",
          value: "center",
        },
        {
          startIcon: "align-right",
          value: "end",
        },
      ],
      defaultValue: "start",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["start", "center", "end"],
          },
        },
      },
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.URL,
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
        ]);
      },
    },
    {
      propertyName: "verticalAlignment",
      label: "Vertical alignment",
      helpText: "Sets the vertical alignment of the content in the column",
      controlType: "ICON_TABS",
      options: [
        {
          startIcon: "vertical-align-top",
          value: "start",
        },
        {
          startIcon: "vertical-align-middle",
          value: "center",
        },
        {
          startIcon: "vertical-align-bottom",
          value: "end",
        },
      ],
      defaultValue: "center",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["start", "center", "end"],
          },
        },
      },
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.URL,
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
        ]);
      },
    },
  ],
};
