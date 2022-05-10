import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { hideByColumnType } from "../../propertyUtils";

export default {
  sectionName: "Styles",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [
        ColumnTypes.TEXT,
        ColumnTypes.DATE,
        ColumnTypes.NUMBER,
        ColumnTypes.URL,
        ColumnTypes.EDIT_ACTIONS,
      ],
      true,
    );
  },
  dependencies: ["primaryColumns", "columnOrder"],
  children: [
    {
      propertyName: "horizontalAlignment",
      label: "Text Align",
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
      customJSControl: "COMPUTE_VALUE_V2",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
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
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
    },
    {
      propertyName: "textSize",
      label: "Text Size",
      controlType: "DROP_DOWN",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
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
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "fontStyle",
      label: "Font Style",
      controlType: "BUTTON_TABS",
      options: [
        {
          icon: "BOLD_FONT",
          value: "BOLD",
        },
        {
          icon: "ITALICS_FONT",
          value: "ITALIC",
        },
        {
          icon: "UNDERLINE",
          value: "UNDERLINE",
        },
      ],
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "verticalAlignment",
      label: "Vertical Alignment",
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
      defaultValue: "LEFT",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
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
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
    },
    {
      propertyName: "textColor",
      label: "Text Color",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
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
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
        ]);
      },
    },
    {
      propertyName: "cellBackground",
      label: "Cell Background",
      controlType: "COLOR_PICKER",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
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
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.URL,
          ColumnTypes.EDIT_ACTIONS,
        ]);
      },
    },
  ],
};
