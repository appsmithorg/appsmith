import { ValidationTypes } from "constants/WidgetValidation";
import { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes, hideByColumnType } from "../../propertyUtils";

export default {
  sectionName: "Styles",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.TEXT, ColumnTypes.DATE, ColumnTypes.NUMBER, ColumnTypes.URL],
      true,
    );
  },
  dependencies: ["primaryColumns"],
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
    },
    {
      propertyName: "textSize",
      label: "Text Size",
      controlType: "DROP_DOWN",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      options: [
        {
          label: "Heading 1",
          value: "HEADING1",
          subText: "24px",
          icon: "HEADING_ONE",
        },
        {
          label: "Heading 2",
          value: "HEADING2",
          subText: "18px",
          icon: "HEADING_TWO",
        },
        {
          label: "Heading 3",
          value: "HEADING3",
          subText: "16px",
          icon: "HEADING_THREE",
        },
        {
          label: "Paragraph",
          value: "PARAGRAPH",
          subText: "14px",
          icon: "PARAGRAPH",
        },
        {
          label: "Paragraph 2",
          value: "PARAGRAPH2",
          subText: "12px",
          icon: "PARAGRAPH_TWO",
        },
      ],
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: [
              "HEADING1",
              "HEADING2",
              "HEADING3",
              "PARAGRAPH",
              "PARAGRAPH2",
            ],
          },
        },
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
    },
  ],
};
