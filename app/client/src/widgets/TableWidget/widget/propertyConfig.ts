import { get } from "lodash";
import { TableWidgetProps } from "../constants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import {
  updateDerivedColumnsHook,
  ColumnTypes,
  defaultSelectedRowValidation,
  totalRecordsCountValidation,
  updateColumnStyles,
  updateIconAlignment,
  getBasePropertyPath,
  hideByColumnType,
  uniqueColumnNameValidation,
} from "./propertyUtils";
import {
  createMessage,
  TABLE_WIDGET_TOTAL_RECORD_TOOLTIP,
} from "@appsmith/constants/messages";
import { IconNames } from "@blueprintjs/icons";

const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export default [
  {
    sectionName: "General",
    children: [
      {
        helpText:
          "Takes in an array of objects to display rows in the table. Bind data from an API using {{}}",
        propertyName: "tableData",
        label: "Table Data",
        controlType: "INPUT_TEXT",
        placeholderText: '[{ "name": "John" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.OBJECT_ARRAY,
          params: {
            default: [],
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        helpText: "Columns",
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS",
        label: "Columns",
        updateHook: updateDerivedColumnsHook,
        dependencies: ["derivedColumns", "columnOrder"],
        isBindProperty: false,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: uniqueColumnNameValidation,
            expected: {
              type: "Unique Column Names",
              example: "abc",
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: updateDerivedColumnsHook,
          dependencies: ["primaryColumns", "derivedColumns", "columnOrder"],
          children: [
            {
              sectionName: "Column Control",
              children: [
                {
                  propertyName: "columnType",
                  label: "Column Type",
                  controlType: "DROP_DOWN",
                  customJSControl: "COMPUTE_VALUE",
                  options: [
                    {
                      label: "Plain Text",
                      value: "text",
                    },
                    {
                      label: "URL",
                      value: "url",
                    },
                    {
                      label: "Number",
                      value: "number",
                    },
                    {
                      label: "Image",
                      value: "image",
                    },
                    {
                      label: "Video",
                      value: "video",
                    },
                    {
                      label: "Date",
                      value: "date",
                    },
                    {
                      label: "Button",
                      value: "button",
                    },
                    {
                      label: "Menu Button",
                      value: "menuButton",
                    },
                    {
                      label: "Icon Button",
                      value: "iconButton",
                    },
                  ],
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: false,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "displayText",
                  label: "Display Text",
                  controlType: "COMPUTE_VALUE",
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "url";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: false,
                  isTriggerProperty: false,
                },
                {
                  helpText:
                    "The value computed & shown in each cell. Use {{currentRow}} to reference each row in the table. This property is not accessible outside the column settings.",
                  propertyName: "computedValue",
                  label: "Computed Value",
                  controlType: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.DATE,
                      ColumnTypes.IMAGE,
                      ColumnTypes.NUMBER,
                      ColumnTypes.TEXT,
                      ColumnTypes.VIDEO,
                      ColumnTypes.URL,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "isCellVisible",
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnType",
                  ],
                  label: "Visible",
                  helpText: "Controls the visibility of the cell in the column",
                  updateHook: updateDerivedColumnsHook,
                  defaultValue: true,
                  controlType: "SWITCH",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.TABLE_PROPERTY,
                    params: {
                      type: ValidationTypes.BOOLEAN,
                    },
                  },
                },
                {
                  propertyName: "isDisabled",
                  label: "Disabled",
                  updateHook: updateDerivedColumnsHook,
                  defaultValue: false,
                  controlType: "SWITCH",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.TABLE_PROPERTY,
                    params: {
                      type: ValidationTypes.BOOLEAN,
                    },
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.ICON_BUTTON,
                      ColumnTypes.MENU_BUTTON,
                      ColumnTypes.BUTTON,
                    ]);
                  },
                },
                {
                  propertyName: "isCompact",
                  helpText: "Decides if menu items will consume lesser space",
                  updateHook: updateDerivedColumnsHook,
                  label: "Compact",
                  controlType: "SWITCH",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  isBindProperty: true,
                  validation: {
                    type: ValidationTypes.TABLE_PROPERTY,
                    params: {
                      type: ValidationTypes.BOOLEAN,
                    },
                  },
                  isTriggerProperty: false,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                },
                {
                  propertyName: "inputFormat",
                  label: "Original Date Format",
                  controlType: "DROP_DOWN",
                  options: [
                    {
                      label: "UNIX timestamp (s)",
                      value: "Epoch",
                    },
                    {
                      label: "UNIX timestamp (ms)",
                      value: "Milliseconds",
                    },
                    {
                      label: "YYYY-MM-DD",
                      value: "YYYY-MM-DD",
                    },
                    {
                      label: "YYYY-MM-DD HH:mm",
                      value: "YYYY-MM-DD HH:mm",
                    },
                    {
                      label: "ISO 8601",
                      value: "YYYY-MM-DDTHH:mm:ss.SSSZ",
                    },
                    {
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                    {
                      label: "Do MMM YYYY",
                      value: "Do MMM YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY HH:mm",
                      value: "DD/MM/YYYY HH:mm",
                    },
                    {
                      label: "LLL",
                      value: "LLL",
                    },
                    {
                      label: "LL",
                      value: "LL",
                    },
                    {
                      label: "D MMMM, YYYY",
                      value: "D MMMM, YYYY",
                    },
                    {
                      label: "H:mm A D MMMM, YYYY",
                      value: "H:mm A D MMMM, YYYY",
                    },
                    {
                      label: "MM-DD-YYYY",
                      value: "MM-DD-YYYY",
                    },
                    {
                      label: "DD-MM-YYYY",
                      value: "DD-MM-YYYY",
                    },
                    {
                      label: "MM/DD/YYYY",
                      value: "MM/DD/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YY",
                      value: "DD/MM/YY",
                    },
                    {
                      label: "MM/DD/YY",
                      value: "MM/DD/YY",
                    },
                  ],
                  defaultValue: "YYYY-MM-DD HH:mm",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  validation: {
                    type: ValidationTypes.TABLE_PROPERTY,
                    params: {
                      type: ValidationTypes.TEXT,
                      params: {
                        allowedValues: [
                          "Epoch",
                          "Milliseconds",
                          "YYYY-MM-DD",
                          "YYYY-MM-DD HH:mm",
                          "YYYY-MM-DDTHH:mm:ss.sssZ",
                          "YYYY-MM-DDTHH:mm:ss",
                          "YYYY-MM-DD hh:mm:ss",
                          "Do MMM YYYY",
                          "DD/MM/YYYY",
                          "DD/MM/YYYY HH:mm",
                          "LLL",
                          "LL",
                          "D MMMM, YYYY",
                          "H:mm A D MMMM, YYYY",
                          "MM-DD-YYYY",
                          "DD-MM-YYYY",
                          "MM/DD/YYYY",
                          "DD/MM/YYYY",
                          "DD/MM/YY",
                          "MM/DD/YY",
                        ],
                      },
                    },
                  },
                  isTriggerProperty: false,
                },
                {
                  propertyName: "outputFormat",
                  label: "Display Date Format",
                  controlType: "DROP_DOWN",
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  options: [
                    {
                      label: "UNIX timestamp (s)",
                      value: "Epoch",
                    },
                    {
                      label: "UNIX timestamp (ms)",
                      value: "Milliseconds",
                    },
                    {
                      label: "YYYY-MM-DD",
                      value: "YYYY-MM-DD",
                    },
                    {
                      label: "YYYY-MM-DD HH:mm",
                      value: "YYYY-MM-DD HH:mm",
                    },
                    {
                      label: "ISO 8601",
                      value: "YYYY-MM-DDTHH:mm:ss.SSSZ",
                    },
                    {
                      label: "YYYY-MM-DDTHH:mm:ss",
                      value: "YYYY-MM-DDTHH:mm:ss",
                    },
                    {
                      label: "YYYY-MM-DD hh:mm:ss",
                      value: "YYYY-MM-DD hh:mm:ss",
                    },
                    {
                      label: "Do MMM YYYY",
                      value: "Do MMM YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY HH:mm",
                      value: "DD/MM/YYYY HH:mm",
                    },
                    {
                      label: "LLL",
                      value: "LLL",
                    },
                    {
                      label: "LL",
                      value: "LL",
                    },
                    {
                      label: "D MMMM, YYYY",
                      value: "D MMMM, YYYY",
                    },
                    {
                      label: "H:mm A D MMMM, YYYY",
                      value: "H:mm A D MMMM, YYYY",
                    },
                    {
                      label: "MM-DD-YYYY",
                      value: "MM-DD-YYYY",
                    },
                    {
                      label: "DD-MM-YYYY",
                      value: "DD-MM-YYYY",
                    },
                    {
                      label: "MM/DD/YYYY",
                      value: "MM/DD/YYYY",
                    },
                    {
                      label: "DD/MM/YYYY",
                      value: "DD/MM/YYYY",
                    },
                    {
                      label: "DD/MM/YY",
                      value: "DD/MM/YY",
                    },
                    {
                      label: "MM/DD/YY",
                      value: "MM/DD/YY",
                    },
                  ],
                  defaultValue: "YYYY-MM-DD HH:mm",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "date";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnType",
                  ],
                  isBindProperty: true,
                  validation: {
                    type: ValidationTypes.TABLE_PROPERTY,
                    params: {
                      type: ValidationTypes.TEXT,
                      params: {
                        allowedValues: [
                          "Epoch",
                          "Milliseconds",
                          "YYYY-MM-DD",
                          "YYYY-MM-DD HH:mm",
                          "YYYY-MM-DDTHH:mm:ss.sssZ",
                          "YYYY-MM-DDTHH:mm:ss",
                          "YYYY-MM-DD hh:mm:ss",
                          "Do MMM YYYY",
                          "DD/MM/YYYY",
                          "DD/MM/YYYY HH:mm",
                          "LLL",
                          "LL",
                          "D MMMM, YYYY",
                          "H:mm A D MMMM, YYYY",
                          "MM-DD-YYYY",
                          "DD-MM-YYYY",
                          "MM/DD/YYYY",
                          "DD/MM/YYYY",
                          "DD/MM/YY",
                          "MM/DD/YY",
                        ],
                      },
                    },
                  },
                  isTriggerProperty: false,
                },
                {
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    const baseProperty = getBasePropertyPath(propertyPath);
                    const columnType = get(
                      props,
                      `${baseProperty}.columnType`,
                      "",
                    );
                    return columnType !== "image";
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: true,
                },
              ],
            },
            {
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
                  ],
                  true,
                );
              },
              dependencies: ["primaryColumns", "derivedColumns"],
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
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
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
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
            },
            {
              sectionName: "Button Properties",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                return hideByColumnType(
                  props,
                  propertyPath,
                  [
                    ColumnTypes.BUTTON,
                    ColumnTypes.MENU_BUTTON,
                    ColumnTypes.ICON_BUTTON,
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
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  controlType: "ICON_SELECT",
                  customJSControl: "COMPUTE_VALUE",
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
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Action",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "menuButtonLabel",
                  label: "Label",
                  controlType: "COMPUTE_VALUE",
                  defaultValue: "Open Menu",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: false,
                },
                {
                  propertyName: "buttonColor",
                  label: "Button Color",
                  controlType: "COLOR_PICKER",
                  helpText: "Changes the color of the button",
                  isJSConvertible: true,
                  customJSControl: "COMPUTE_VALUE",
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.BUTTON,
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  helpText: "Sets the variant of the icon button",
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  helpText:
                    "Rounds the corners of the icon button's outer border edge",
                  controlType: "BORDER_RADIUS_OPTIONS",
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                  options: [
                    ButtonBorderRadiusTypes.SHARP,
                    ButtonBorderRadiusTypes.ROUNDED,
                    ButtonBorderRadiusTypes.CIRCLE,
                  ],
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  isJSConvertible: true,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  customJSControl: "COMPUTE_VALUE",
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  updateHook: updateDerivedColumnsHook,
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
                  helpText:
                    "Sets the custom color preset based on the menu button variant",
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
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  // Remove menu Style once Custom is Chosen
                  updateHook: updateDerivedColumnsHook,
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
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
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
                  helpText:
                    "Rounds the corners of the icon button's outer border edge",
                  controlType: "BUTTON_BORDER_RADIUS_OPTIONS",
                  isBindProperty: false,
                  isTriggerProperty: false,
                  updateHook: updateDerivedColumnsHook,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
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
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
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
                  updateHook: updateDerivedColumnsHook,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.MENU_BUTTON,
                    ]);
                  },
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  validation: {
                    type: ValidationTypes.TEXT,
                    params: {
                      regex: /^(?![<|{{]).+/,
                    },
                  },
                },

                {
                  helpText: "Triggers an action when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  additionalAutoComplete: (props: TableWidgetProps) => ({
                    currentRow: Object.assign(
                      {},
                      ...Object.keys(props.primaryColumns).map((key) => ({
                        [key]: "",
                      })),
                    ),
                  }),
                  isJSConvertible: true,
                  dependencies: [
                    "primaryColumns",
                    "derivedColumns",
                    "columnOrder",
                  ],
                  isBindProperty: true,
                  isTriggerProperty: true,
                  hidden: (props: TableWidgetProps, propertyPath: string) => {
                    return hideByColumnType(props, propertyPath, [
                      ColumnTypes.BUTTON,
                      ColumnTypes.ICON_BUTTON,
                    ]);
                  },
                },
              ],
            },
            {
              sectionName: "Menu Items",
              hidden: (props: TableWidgetProps, propertyPath: string) => {
                return hideByColumnType(
                  props,
                  propertyPath,
                  [ColumnTypes.MENU_BUTTON],
                  true,
                );
              },
              updateHook: updateDerivedColumnsHook,
              children: [
                {
                  helpText: "Menu items",
                  propertyName: "menuItems",
                  controlType: "MENU_ITEMS",
                  label: "",
                  isBindProperty: false,
                  isTriggerProperty: false,
                  dependencies: ["derivedColumns", "columnOrder"],
                  panelConfig: {
                    editableTitle: true,
                    titlePropertyName: "label",
                    panelIdPropertyName: "id",
                    updateHook: updateDerivedColumnsHook,
                    dependencies: [
                      "primaryColumns",
                      "derivedColumns",
                      "columnOrder",
                    ],
                    children: [
                      {
                        sectionName: "General",
                        children: [
                          {
                            propertyName: "label",
                            helpText: "Sets the label of a menu item",
                            label: "Label",
                            controlType: "INPUT_TEXT",
                            placeholderText: "Enter label",
                            isBindProperty: true,
                            isTriggerProperty: false,
                            validation: { type: ValidationTypes.TEXT },
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "backgroundColor",
                            helpText:
                              "Sets the background color of a menu item",
                            label: "Background color",
                            controlType: "COLOR_PICKER",
                            isBindProperty: false,
                            isTriggerProperty: false,
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "textColor",
                            helpText: "Sets the text color of a menu item",
                            label: "Text color",
                            controlType: "COLOR_PICKER",
                            isBindProperty: false,
                            isTriggerProperty: false,
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "isDisabled",
                            helpText: "Disables input to the widget",
                            label: "Disabled",
                            controlType: "SWITCH",
                            isJSConvertible: true,
                            isBindProperty: true,
                            isTriggerProperty: false,
                            validation: { type: ValidationTypes.BOOLEAN },
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "isVisible",
                            helpText: "Controls the visibility of the widget",
                            label: "Visible",
                            controlType: "SWITCH",
                            isJSConvertible: true,
                            isBindProperty: true,
                            isTriggerProperty: false,
                            validation: { type: ValidationTypes.BOOLEAN },
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                        ],
                      },
                      {
                        sectionName: "Icon Options",
                        children: [
                          {
                            propertyName: "iconName",
                            label: "Icon",
                            helpText:
                              "Sets the icon to be used for a menu item",
                            controlType: "ICON_SELECT",
                            isBindProperty: false,
                            isTriggerProperty: false,
                            validation: { type: ValidationTypes.TEXT },
                            updateHook: updateDerivedColumnsHook,
                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "iconColor",
                            helpText: "Sets the icon color of a menu item",
                            label: "Icon color",
                            controlType: "COLOR_PICKER",
                            isBindProperty: false,
                            isTriggerProperty: false,
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                          {
                            propertyName: "iconAlign",
                            label: "Icon alignment",
                            helpText: "Sets the icon alignment of a menu item",
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
                            validation: { type: ValidationTypes.TEXT },
                            updateHook: updateDerivedColumnsHook,

                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                        ],
                      },
                      {
                        sectionName: "Events",
                        children: [
                          {
                            helpText:
                              "Triggers an action when the menu item is clicked",
                            propertyName: "onClick",
                            label: "onItemClick",
                            controlType: "ACTION_SELECTOR",
                            isJSConvertible: true,
                            isBindProperty: true,
                            isTriggerProperty: true,
                            dependencies: [
                              "primaryColumns",
                              "derivedColumns",
                              "columnOrder",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
      {
        helpText:
          "Assigns a unique column which helps maintain selectedRows and triggeredRows based on value",
        propertyName: "primaryColumnId",
        dependencies: ["primaryColumns"],
        label: "Primary key column",
        controlType: "PRIMARY_COLUMNS_DROPDOWN",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "defaultSearchText",
        label: "Default Search Text",
        controlType: "INPUT_TEXT",
        placeholderText: "{{appsmith.user.name}}",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        helpText: "Selects row(s) by default",
        propertyName: "defaultSelectedRow",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        placeholderText: "0",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: defaultSelectedRowValidation,
            expected: {
              type: "Index of row(s)",
              example: "0 | [0, 1]",
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        dependencies: ["multiRowSelection"],
      },
      {
        propertyName: "compactMode",
        helpText: "Selects row height",
        label: "Default Row Height",
        controlType: "DROP_DOWN",
        defaultValue: "DEFAULT",
        isBindProperty: true,
        isTriggerProperty: false,
        options: [
          {
            label: "Short",
            value: "SHORT",
          },
          {
            label: "Default",
            value: "DEFAULT",
          },
          {
            label: "Tall",
            value: "TALL",
          },
        ],
      },
      {
        helpText:
          "Bind the Table.pageNo property in your API and call it onPageChange",
        propertyName: "serverSidePaginationEnabled",
        label: "Server Side Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: createMessage(TABLE_WIDGET_TOTAL_RECORD_TOOLTIP),
        propertyName: "totalRecordsCount",
        label: "Total Record Count",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter total record count",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: totalRecordsCountValidation,
            expected: {
              type: "Number",
              example: "10",
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
        hidden: (props: TableWidgetProps) =>
          !!!props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "isVisible",
        isJSConvertible: true,
        label: "Visible",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Controls sorting in View Mode",
        propertyName: "isSortable",
        isJSConvertible: true,
        label: "Sortable",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
          params: {
            default: true,
          },
        },
      },
      {
        propertyName: "multiRowSelection",
        label: "Enable multi row selection",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "enableClientSideSearch",
        label: "Enable client side search",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "Triggers an action when a table row is selected",
        propertyName: "onRowSelected",
        label: "onRowSelected",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when a table page is changed",
        propertyName: "onPageChange",
        label: "onPageChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when a table page size is changed",
        propertyName: "onPageSizeChange",
        label: "onPageSizeChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        propertyName: "onSearchTextChanged",
        label: "onSearchTextChanged",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when a table column is sorted",
        propertyName: "onSort",
        label: "onSort",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
  {
    sectionName: "Header options",
    children: [
      {
        helpText: "Toggle visibility of the search box",
        propertyName: "isVisibleSearch",
        label: "Search",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Toggle visibility of the filters",
        propertyName: "isVisibleFilters",
        label: "Filters",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Toggle visibility of the data download",
        propertyName: "isVisibleDownload",
        label: "Download",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        helpText: "Toggle visibility of the pagination",
        propertyName: "isVisiblePagination",
        label: "Pagination",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "delimiter",
        label: "CSV Separator",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter CSV separator",
        helpText: "The character used for separating the CSV download file.",
        isBindProperty: true,
        isTriggerProperty: false,
        defaultValue: ",",
        validation: {
          type: ValidationTypes.TEXT,
        },
        hidden: (props: TableWidgetProps) => !props.isVisibleDownload,
        dependencies: ["isVisibleDownload"],
      },
    ],
  },
  {
    sectionName: "Styles",
    children: [
      {
        propertyName: "cellBackground",
        label: "Cell Background Color",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textColor",
        label: "Text Color",
        controlType: "COLOR_PICKER",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "textSize",
        label: "Text Size",
        controlType: "DROP_DOWN",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
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
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "fontStyle",
        label: "Font Style",
        controlType: "BUTTON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
        options: [
          {
            icon: "BOLD_FONT",
            value: "BOLD",
          },
          {
            icon: "ITALICS_FONT",
            value: "ITALIC",
          },
        ],
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "horizontalAlignment",
        label: "Text Align",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
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
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "verticalAlignment",
        label: "Vertical Alignment",
        controlType: "ICON_TABS",
        updateHook: updateColumnStyles,
        dependencies: ["primaryColumns", "derivedColumns"],
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
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
] as PropertyPaneConfig[];
