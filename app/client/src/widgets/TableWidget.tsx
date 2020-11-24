import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import {
  compare,
  ConditionFunctions,
  getAllTableColumnKeys,
  getDefaultColumnProperties,
  renderCell,
  renderDropdown,
  renderActions,
  sortTableFunction,
  reorderColumns,
} from "components/designSystems/appsmith/TableUtilities";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import moment from "moment";
import { isNumber, isString, isUndefined } from "lodash";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta, { WithMeta } from "./MetaHOC";
import { Colors } from "constants/Colors";

const ReactTableComponent = lazy(() =>
  retryPromise(() =>
    import("components/designSystems/appsmith/ReactTableComponent"),
  ),
);

export type TableSizes = {
  COLUMN_HEADER_HEIGHT: number;
  TABLE_HEADER_HEIGHT: number;
  ROW_HEIGHT: number;
  ROW_FONT_SIZE: number;
};

export enum CompactModeTypes {
  SHORT = "SHORT",
  DEFAULT = "DEFAULT",
  TALL = "TALL",
}

export enum CellAlignmentTypes {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  CENTER = "CENTER",
}

export enum VerticalAlignmentTypes {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  CENTER = "CENTER",
}

export enum TextSizes {
  HEADING1 = "HEADING1",
  HEADING2 = "HEADING2",
  HEADING3 = "HEADING3",
  PARAGRAPH = "PARAGRAPH",
  BULLETPOINTS = "BULLETPOINTS",
}

export enum FontStyleTypes {
  BOLD = "BOLD",
  ITALIC = "ITALIC",
  NORMAL = "NORMAL",
}

export const TABLE_SIZES: { [key: string]: TableSizes } = {
  [CompactModeTypes.DEFAULT]: {
    COLUMN_HEADER_HEIGHT: 38,
    TABLE_HEADER_HEIGHT: 42,
    ROW_HEIGHT: 40,
    ROW_FONT_SIZE: 14,
  },
  [CompactModeTypes.SHORT]: {
    COLUMN_HEADER_HEIGHT: 38,
    TABLE_HEADER_HEIGHT: 42,
    ROW_HEIGHT: 20,
    ROW_FONT_SIZE: 12,
  },
  [CompactModeTypes.TALL]: {
    COLUMN_HEADER_HEIGHT: 38,
    TABLE_HEADER_HEIGHT: 42,
    ROW_HEIGHT: 60,
    ROW_FONT_SIZE: 18,
  },
};

export enum ColumnTypes {
  CURRENCY = "currency",
  TIME = "time",
  DATE = "date",
  VIDEO = "video",
  IMAGE = "image",
  TEXT = "text",
  NUMBER = "number",
}

export enum OperatorTypes {
  OR = "OR",
  AND = "AND",
}

class TableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      tableData: VALIDATION_TYPES.TABLE_DATA,
      nextPageKey: VALIDATION_TYPES.TEXT,
      prevPageKey: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      searchText: VALIDATION_TYPES.TEXT,
      defaultSearchText: VALIDATION_TYPES.TEXT,
      primaryColumns: VALIDATION_TYPES.ARRAY,
      derivedColumns: VALIDATION_TYPES.ARRAY,
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Takes in an array of objects to display rows in the table. Bind data from an API using {{}}",
            propertyName: "tableData",
            label: "Table Data",
            controlType: "INPUT_TEXT",
            placeholderText: 'Enter [{ "col1": "val1" }]',
            inputType: "ARRAY",
          },
          {
            helpText: "Existing Columns",
            propertyName: "primaryColumns",
            controlType: "PRIMARY_COLUMNS",
            label: "Existing Columns",
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "label",
              panelIdPropertyName: "id",
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
                          label: "Time",
                          value: "time",
                        },
                        {
                          label: "Currency",
                          value: "currencys",
                        },
                        {
                          label: "Button",
                          value: "button",
                        },
                        // {
                        //   label: "Dropdown",
                        //   value: "dropdown",
                        // },
                      ],
                    },
                    {
                      propertyName: "outputFormat",
                      label: "Currency Type",
                      controlType: "DROP_DOWN",
                      options: [
                        {
                          label: "USD - $",
                          value: "$",
                        },
                        {
                          label: "INR - ₹",
                          value: "₹",
                        },
                        {
                          label: "GBP - £",
                          value: "£",
                        },
                        {
                          label: "AUD - A$",
                          value: "A$",
                        },
                        {
                          label: "EUR - €",
                          value: "€",
                        },
                        {
                          label: "SGD - S$",
                          value: "S$",
                        },
                        {
                          label: "CAD - C$",
                          value: "C$",
                        },
                      ],
                      customJSControl: "COMPUTE_VALUE",
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "currency";
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
                          label: "YYYY-MM-DDTHH:mm:ss",
                          value: "YYYY-MM-DDTHH:mm:ss",
                        },
                        {
                          label: "YYYY-MM-DD hh:mm:ss",
                          value: "YYYY-MM-DD hh:mm:ss",
                        },
                      ],
                      customJSControl: "COMPUTE_VALUE",
                      isJSConvertible: true,
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "date";
                      },
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
                          label: "YYYY-MM-DDTHH:mm:ss",
                          value: "YYYY-MM-DDTHH:mm:ss",
                        },
                        {
                          label: "YYYY-MM-DD hh:mm:ss",
                          value: "YYYY-MM-DD hh:mm:ss",
                        },
                        {
                          label: "DD-MM-YYYY HH:mm",
                          value: "DD-MM-YYYY HH:mm",
                        },
                        {
                          label: "DD-MM-YYYY",
                          value: "DD-MM-YYYY",
                        },
                        {
                          label: "Do MMM YYYY",
                          value: "Do MMM YYYY",
                        },
                      ],
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "date";
                      },
                    },
                    {
                      propertyName: "computedValue",
                      label: "Computed Value",
                      controlType: "COMPUTE_VALUE",
                      hidden: (props: ColumnProperties) => {
                        return props.columnType === "button";
                      },
                    },
                  ],
                },
                {
                  sectionName: "Text",
                  hidden: (props: ColumnProperties) => {
                    return (
                      props.columnType === "button" ||
                      props.columnType === "dropdown"
                    );
                  },
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
                          label: "Bullet Points",
                          value: "BULLETPOINTS",
                          subText: "14px",
                          icon: "BULLETS",
                        },
                      ],
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
                      ],
                      defaultValue: "NORMAL",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
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
                    },
                    {
                      propertyName: "textColor",
                      label: "Text Color",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.THUNDER,
                    },
                    {
                      propertyName: "cellBackground",
                      label: "Cell Background",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.WHITE,
                    },
                  ],
                },
                {
                  sectionName: "Button Properties",
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "button";
                  },
                  children: [
                    {
                      propertyName: "buttonLabel",
                      label: "Label",
                      controlType: "COMPUTE_VALUE",
                      defaultValue: "Action",
                    },
                    {
                      propertyName: "buttonStyle",
                      label: "Button Color",
                      controlType: "COLOR_PICKER",
                      helpText: "Changes the color of the button",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.GREEN,
                    },
                    {
                      propertyName: "buttonLabelColor",
                      label: "Label Color",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.WHITE,
                    },
                    {
                      helpText: "Triggers an action when the button is clicked",
                      propertyName: "onClick",
                      label: "onClick",
                      controlType: "ACTION_SELECTOR",
                      isJSConvertible: true,
                    },
                  ],
                },
              ],
            },
          },
          {
            helpText: "Created Columns",
            propertyName: "derivedColumns",
            controlType: "ADDITIONAL_COLUMNS",
            label: "Created Columns",
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "label",
              panelIdPropertyName: "id",
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
                          label: "Time",
                          value: "time",
                        },
                        {
                          label: "Currency",
                          value: "currencys",
                        },
                        {
                          label: "Button",
                          value: "button",
                        },
                      ],
                    },
                    {
                      propertyName: "outputFormat",
                      label: "Currency Type",
                      controlType: "DROP_DOWN",
                      options: [
                        {
                          label: "USD - $",
                          value: "$",
                        },
                        {
                          label: "INR - ₹",
                          value: "₹",
                        },
                        {
                          label: "GBP - £",
                          value: "£",
                        },
                        {
                          label: "AUD - A$",
                          value: "A$",
                        },
                        {
                          label: "EUR - €",
                          value: "€",
                        },
                        {
                          label: "SGD - S$",
                          value: "S$",
                        },
                        {
                          label: "CAD - C$",
                          value: "C$",
                        },
                      ],
                      customJSControl: "COMPUTE_VALUE",
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "currency";
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
                          label: "YYYY-MM-DDTHH:mm:ss",
                          value: "YYYY-MM-DDTHH:mm:ss",
                        },
                        {
                          label: "YYYY-MM-DD hh:mm:ss",
                          value: "YYYY-MM-DD hh:mm:ss",
                        },
                      ],
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "date";
                      },
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
                          label: "YYYY-MM-DDTHH:mm:ss",
                          value: "YYYY-MM-DDTHH:mm:ss",
                        },
                        {
                          label: "YYYY-MM-DD hh:mm:ss",
                          value: "YYYY-MM-DD hh:mm:ss",
                        },
                        {
                          label: "DD-MM-YYYY HH:mm",
                          value: "DD-MM-YYYY HH:mm",
                        },
                        {
                          label: "DD-MM-YYYY",
                          value: "DD-MM-YYYY",
                        },
                        {
                          label: "Do MMM YYYY",
                          value: "Do MMM YYYY",
                        },
                      ],
                      hidden: (props: ColumnProperties) => {
                        return props.columnType !== "date";
                      },
                    },
                    {
                      propertyName: "computedValue",
                      label: "Computed Value",
                      controlType: "COMPUTE_VALUE",
                      hidden: (props: ColumnProperties) => {
                        return props.columnType === "button";
                      },
                    },
                  ],
                },
                {
                  sectionName: "Text",
                  hidden: (props: ColumnProperties) => {
                    return (
                      props.columnType === "button" ||
                      props.columnType === "dropdown"
                    );
                  },
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
                          label: "Bullet Points",
                          value: "BULLETPOINTS",
                          subText: "14px",
                          icon: "BULLETS",
                        },
                      ],
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
                      ],
                      defaultValue: "NORMAL",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
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
                    },
                    {
                      propertyName: "textColor",
                      label: "Text Color",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.THUNDER,
                    },
                    {
                      propertyName: "cellBackground",
                      label: "Cell Background",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.WHITE,
                    },
                  ],
                },
                {
                  sectionName: "Button Properties",
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "button";
                  },
                  children: [
                    {
                      propertyName: "buttonLabel",
                      label: "Label",
                      controlType: "COMPUTE_VALUE",
                      defaultValue: "Action",
                    },
                    {
                      propertyName: "buttonStyle",
                      label: "Button Color",
                      controlType: "COLOR_PICKER",
                      helpText: "Changes the color of the button",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.GREEN,
                    },
                    {
                      propertyName: "buttonLabelColor",
                      label: "Label Color",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      customJSControl: "COMPUTE_VALUE",
                      defaultColor: Colors.WHITE,
                    },
                    {
                      helpText: "Triggers an action when the button is clicked",
                      propertyName: "onClick",
                      label: "onClick",
                      controlType: "ACTION_SELECTOR",
                      isJSConvertible: true,
                    },
                  ],
                },
                {
                  sectionName: "Dropdown Properties",
                  hidden: (props: ColumnProperties) => {
                    return props.columnType !== "dropdown";
                  },
                  children: [
                    {
                      helpText:
                        "Allows users to select either a single option or multiple options. Values must be unique",
                      propertyName: "dropdownOptions",
                      label: "Options",
                      controlType: "INPUT_TEXT",
                      placeholderText: `Enter [{label: "label1", value: "value2"}]`,
                    },
                    {
                      helpText:
                        "Triggers an action when a user selects an option",
                      propertyName: "onOptionChange",
                      label: "onOptionChange",
                      controlType: "ACTION_SELECTOR",
                      isJSConvertible: true,
                    },
                  ],
                },
              ],
            },
          },
          {
            propertyName: "defaultSearchText",
            label: "Default Search Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter default search text",
          },
          {
            helpText:
              "Bind the Table.pageNo property in your API and call it onPageChange",
            propertyName: "serverSidePaginationEnabled",
            label: "Server Side Pagination",
            controlType: "SWITCH",
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            isJSConvertible: true,
            label: "Visible",
            controlType: "SWITCH",
          },
          {
            propertyName: "multiRowSelection",
            label: "Enable multi row selection",
            controlType: "SWITCH",
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when a table row is selected",
            propertyName: "onRowSelected",
            label: "onRowSelected",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
          {
            helpText: "Triggers an action when a table page is changed",
            propertyName: "onPageChange",
            label: "onPageChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
          {
            propertyName: "onSearchTextChanged",
            label: "onSearchTextChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      pageSize: undefined,
      selectedRowIndex: -1,
      selectedRowIndices: [],
      searchText: undefined,
      selectedRow: {},
      selectedRows: [],
      // The following meta property is used for rendering the table.
      filteredTableData: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
      onSearchTextChanged: true,
      columnActions: true,
    };
  }

  getCellProperties = (
    columnProperties: ColumnProperties,
    rowIndex: number,
  ) => {
    const cellProperties: CellLayoutProperties = {
      horizontalAlignment: Array.isArray(columnProperties.horizontalAlignment)
        ? columnProperties.horizontalAlignment[rowIndex]
        : columnProperties.horizontalAlignment,
      verticalAlignment: Array.isArray(columnProperties.verticalAlignment)
        ? columnProperties.verticalAlignment[rowIndex]
        : columnProperties.verticalAlignment,
      textSize: Array.isArray(columnProperties.textSize)
        ? columnProperties.textSize[rowIndex]
        : columnProperties.textSize,
      fontStyle: Array.isArray(columnProperties.fontStyle)
        ? columnProperties.fontStyle[rowIndex]
        : columnProperties.fontStyle,
      textColor: Array.isArray(columnProperties.textColor)
        ? columnProperties.textColor[rowIndex]
        : columnProperties.textColor,
      cellBackground: Array.isArray(columnProperties.cellBackground)
        ? columnProperties.cellBackground[rowIndex]
        : columnProperties.cellBackground,
      buttonStyle: Array.isArray(columnProperties.buttonStyle)
        ? columnProperties.buttonStyle[rowIndex]
        : columnProperties.buttonStyle,
      buttonLabelColor: Array.isArray(columnProperties.buttonLabelColor)
        ? columnProperties.buttonLabelColor[rowIndex]
        : columnProperties.buttonLabelColor,
      buttonLabel: Array.isArray(columnProperties.buttonLabel)
        ? columnProperties.buttonLabel[rowIndex]
        : columnProperties.buttonLabel,
    };
    return cellProperties;
  };

  getTableColumns = () => {
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    const { primaryColumns, derivedColumns, sortedColumn } = this.props;
    const allColumns = derivedColumns
      ? [...(primaryColumns || []), ...derivedColumns]
      : [...(primaryColumns || [])];
    const sortColumn = sortedColumn?.column;
    const sortOrder = sortedColumn?.asc;
    for (let index = 0; index < allColumns.length; index++) {
      const columnProperties = allColumns[index];
      const isHidden = !columnProperties.isVisible;
      const columnData = {
        Header: columnProperties.label,
        accessor: columnProperties.id,
        width: columnProperties.width,
        minWidth: 60,
        draggable: true,
        isHidden: false,
        isAscOrder: columnProperties.id === sortColumn ? sortOrder : undefined,
        isDerived: columnProperties.isDerived,
        metaProperties: {
          isHidden: isHidden,
          type: columnProperties.columnType,
          format: columnProperties?.outputFormat || "",
          inputFormat: columnProperties?.inputFormat || "",
        },
        columnProperties: JSON.stringify(columnProperties),
        Cell: (props: any) => {
          const rowIndex: number = props.cell.row.index;
          const cellProperties = this.getCellProperties(
            columnProperties,
            rowIndex,
          );
          if (columnProperties.columnType === "button") {
            const buttonProps = {
              isSelected: !!props.row.isSelected,
              onCommandClick: this.onCommandClick,
              backgroundColor: cellProperties.buttonStyle || "#29CCA3",
              buttonLabelColor: cellProperties.buttonLabelColor || "#FFFFFF",
              columnActions: [
                {
                  id: columnProperties.id,
                  label: cellProperties.buttonLabel || "Action",
                  dynamicTrigger: columnProperties.onClick || "",
                },
              ],
            };
            return renderActions(buttonProps, isHidden);
          } else if (columnProperties.columnType === "dropdown") {
            let options = [];
            try {
              options = JSON.parse(columnProperties.dropdownOptions || "");
            } catch (e) {}
            return renderDropdown({
              options: options,
              onItemSelect: this.onItemSelect,
              onOptionChange: columnProperties.onOptionChange || "",
              selectedIndex: isNumber(props.cell.value)
                ? props.cell.value
                : undefined,
            });
          } else {
            return renderCell(
              props.cell.value,
              columnProperties.columnType,
              isHidden,
              cellProperties,
            );
          }
        },
      };
      if (isHidden) {
        columnData.isHidden = true;
        hiddenColumns.push(columnData);
      } else {
        columns.push(columnData);
      }
    }
    if (hiddenColumns.length && this.props.renderMode === RenderModes.CANVAS) {
      columns = columns.concat(hiddenColumns);
    }
    if (this.props.columnOrder) {
      columns = reorderColumns(columns, this.props.columnOrder);
    }
    return columns.filter((column: ReactTableColumnProps) => column.accessor);
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    const updatedTableData = [];
    for (let row = 0; row < tableData.length; row++) {
      const data: { [key: string]: any } = tableData[row];
      const tableRow: { [key: string]: any } = {};
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        const { accessor } = column;
        let value = data[accessor];
        if (column.metaProperties) {
          const type = column.metaProperties.type;
          const format = column.metaProperties.format;
          switch (type) {
            case ColumnTypes.CURRENCY:
              if (!isNaN(value)) {
                tableRow[accessor] = `${format}${value ? value : ""}`;
              } else {
                tableRow[accessor] = "Invalid Value";
              }
              break;
            case ColumnTypes.DATE:
              let isValidDate = true;
              let outputFormat = column.metaProperties.format;
              let inputFormat;
              try {
                const type = column.metaProperties.inputFormat;
                if (type !== "EPOCH" && type !== "Milliseconds") {
                  inputFormat = type;
                  moment(value, inputFormat);
                } else if (!isNumber(value)) {
                  isValidDate = false;
                }
              } catch (e) {
                isValidDate = false;
              }
              if (isValidDate) {
                if (outputFormat === "SAME_AS_INPUT") {
                  outputFormat = inputFormat;
                }
                if (column.metaProperties.inputFormat === "Milliseconds") {
                  value = 1000 * Number(value);
                }
                tableRow[accessor] = moment(value, inputFormat).format(
                  outputFormat,
                );
              } else if (value) {
                tableRow[accessor] = "Invalid Value";
              } else {
                tableRow[accessor] = "";
              }
              break;
            case ColumnTypes.TIME:
              let isValidTime = true;
              if (isNaN(value)) {
                const time = Date.parse(value);
                if (isNaN(time)) {
                  isValidTime = false;
                }
              }
              if (isValidTime) {
                tableRow[accessor] = moment(value).format("HH:mm");
              } else if (value) {
                tableRow[accessor] = "Invalid Value";
              } else {
                tableRow[accessor] = "";
              }
              break;
            default:
              const data =
                isString(value) || isNumber(value)
                  ? value
                  : isUndefined(value)
                  ? ""
                  : JSON.stringify(value);
              tableRow[accessor] = data;
              break;
          }
        }
      }
      updatedTableData.push(tableRow);
    }
    return updatedTableData;
  };

  filterTableData = () => {
    const { searchText, sortedColumn, filters, tableData } = this.props;
    if (!tableData || !tableData.length) {
      return [];
    }
    const derivedTableData: Array<Record<string, unknown>> = [...tableData];
    if (this.props.primaryColumns) {
      for (let i = 0; i < this.props.primaryColumns.length; i++) {
        const column: ColumnProperties = this.props.primaryColumns[i];
        const columnId = column.id;
        if (column.computedValue && Array.isArray(column.computedValue)) {
          try {
            let computedValues: Array<unknown> = [];
            if (isString(column.computedValue)) {
              computedValues = JSON.parse(column.computedValue);
            } else {
              computedValues = column.computedValue;
            }
            for (let index = 0; index < computedValues.length; index++) {
              derivedTableData[index] = {
                ...derivedTableData[index],
                [columnId]: computedValues[index],
              };
            }
          } catch (e) {
            console.log({ e });
          }
        }
      }
    }
    if (this.props.derivedColumns) {
      for (let i = 0; i < this.props.derivedColumns.length; i++) {
        const column: ColumnProperties = this.props.derivedColumns[i];
        const columnId = column.id;
        if (column.computedValue && Array.isArray(column.computedValue)) {
          try {
            let computedValues: Array<unknown> = [];
            if (isString(column.computedValue)) {
              computedValues = JSON.parse(column.computedValue);
            } else {
              computedValues = column.computedValue;
            }
            for (let index = 0; index < computedValues.length; index++) {
              derivedTableData[index] = {
                ...derivedTableData[index],
                [columnId]: computedValues[index],
              };
            }
          } catch (e) {
            console.log({ e });
          }
        }
      }
    }
    let sortedTableData: any[];
    const columns = this.getTableColumns();
    const searchKey = searchText ? searchText.toUpperCase() : "";
    if (sortedColumn) {
      const sortColumn = sortedColumn.column;
      const sortOrder = sortedColumn.asc;
      sortedTableData = sortTableFunction(
        derivedTableData,
        columns,
        sortColumn,
        sortOrder,
      );
    } else {
      sortedTableData = [...derivedTableData];
    }
    return sortedTableData.filter((item: { [key: string]: any }) => {
      const searchFound = searchKey
        ? Object.values(item)
            .join(", ")
            .toUpperCase()
            .includes(searchKey)
        : true;
      if (!searchFound) return false;
      if (!filters || filters.length === 0) return true;
      const filterOperator: Operator =
        filters.length >= 2 ? filters[1].operator : OperatorTypes.OR;
      let filter = filterOperator === OperatorTypes.AND;
      for (let i = 0; i < filters.length; i++) {
        const filterValue = compare(
          item[filters[i].column],
          filters[i].value,
          filters[i].condition,
        );
        if (filterOperator === OperatorTypes.AND) {
          filter = filter && filterValue;
        } else {
          filter = filter || filterValue;
        }
      }
      return filter;
    });
  };

  getEmptyRow = () => {
    const columnKeys: string[] = getAllTableColumnKeys(this.props.tableData);
    const selectedRow: { [key: string]: any } = {};
    for (let i = 0; i < columnKeys.length; i++) {
      selectedRow[columnKeys[i]] = undefined;
    }
    return selectedRow;
  };

  getSelectedRow = (
    filteredTableData: Array<Record<string, unknown>>,
    selectedRowIndex?: number,
  ) => {
    if (selectedRowIndex === undefined || selectedRowIndex === -1) {
      return this.getEmptyRow();
    }
    return filteredTableData[selectedRowIndex];
  };

  createTablePrimaryColumns = () => {
    const { tableData } = this.props;
    if (tableData) {
      const tableColumns: ColumnProperties[] = [];
      const columnKeys: string[] = getAllTableColumnKeys(tableData);
      for (let index = 0; index < columnKeys.length; index++) {
        const i = columnKeys[index];
        tableColumns.push(
          getDefaultColumnProperties(i, index, this.props.widgetName),
        );
      }
      super.updateWidgetProperty("primaryColumns", tableColumns);
    }
  };

  componentDidMount() {
    const filteredTableData = this.filterTableData();
    const selectedRow = this.getSelectedRow(
      filteredTableData,
      this.props.selectedRowIndex,
    );
    this.props.updateWidgetMetaProperty("filteredTableData", filteredTableData);
    this.props.updateWidgetMetaProperty("selectedRow", selectedRow);
    setTimeout(() => {
      if (!this.props.primaryColumns) {
        this.createTablePrimaryColumns();
      }
    }, 0);
  }
  componentDidUpdate(prevProps: TableWidgetProps) {
    const tableDataModified =
      JSON.stringify(this.props.tableData) !==
      JSON.stringify(prevProps.tableData);
    if (
      tableDataModified ||
      JSON.stringify(this.props.filters) !==
        JSON.stringify(prevProps.filters) ||
      this.props.searchText !== prevProps.searchText ||
      JSON.stringify(this.props.sortedColumn) !==
        JSON.stringify(prevProps.sortedColumn) ||
      !this.props.filteredTableData
    ) {
      const filteredTableData = this.filterTableData();
      this.props.updateWidgetMetaProperty(
        "filteredTableData",
        filteredTableData,
      );
      if (!this.props.multiRowSelection) {
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      } else {
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          filteredTableData.filter(
            (item: Record<string, unknown>, i: number) => {
              return this.props.selectedRowIndices.includes(i);
            },
          ),
        );
      }
    }
    if (tableDataModified) {
      setTimeout(() => {
        this.createTablePrimaryColumns();
      }, 0);
      this.props.updateWidgetMetaProperty("selectedRowIndices", []);
      this.props.updateWidgetMetaProperty("selectedRows", []);
      this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
    }
    if (
      JSON.stringify(this.props.derivedColumns) !==
        JSON.stringify(prevProps.derivedColumns) ||
      JSON.stringify(this.props.primaryColumns) !==
        JSON.stringify(prevProps.primaryColumns)
    ) {
      const filteredTableData = this.filterTableData();
      this.props.updateWidgetMetaProperty(
        "filteredTableData",
        filteredTableData,
      );
      if (!this.props.multiRowSelection) {
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      } else {
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          filteredTableData.filter(
            (item: Record<string, unknown>, i: number) => {
              return this.props.selectedRowIndices.includes(i);
            },
          ),
        );
      }
    }
    if (this.props.multiRowSelection !== prevProps.multiRowSelection) {
      if (this.props.multiRowSelection) {
        const selectedRowIndices = this.props.selectedRowIndex
          ? [this.props.selectedRowIndex]
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
        const filteredTableData = this.filterTableData();
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          filteredTableData.filter(
            (item: Record<string, unknown>, i: number) => {
              return selectedRowIndices.includes(i);
            },
          ),
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      } else {
        const filteredTableData = this.filterTableData();
        this.props.updateWidgetMetaProperty("selectedRowIndices", []);
        this.props.updateWidgetMetaProperty("selectedRows", []);
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData),
        );
      }
    }
  }

  getSelectedRowIndexes = (selectedRowIndexes: string) => {
    return selectedRowIndexes
      ? selectedRowIndexes.split(",").map(i => Number(i))
      : [];
  };

  getPageView() {
    const { hiddenColumns, filteredTableData, selectedRowIndices } = this.props;
    const tableColumns = this.getTableColumns();

    const transformedData = this.transformData(
      filteredTableData || [],
      tableColumns,
    );
    const serverSidePaginationEnabled = (this.props
      .serverSidePaginationEnabled &&
      this.props.serverSidePaginationEnabled) as boolean;
    let pageNo = this.props.pageNo;

    if (pageNo === undefined) {
      pageNo = 1;
      this.props.updateWidgetMetaProperty("pageNo", pageNo);
    }
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    const tableSizes =
      TABLE_SIZES[this.props.compactMode || CompactModeTypes.DEFAULT];
    let pageSize = Math.floor(
      (componentHeight -
        tableSizes.TABLE_HEADER_HEIGHT -
        tableSizes.COLUMN_HEADER_HEIGHT) /
        tableSizes.ROW_HEIGHT,
    );
    if (
      componentHeight -
        (tableSizes.TABLE_HEADER_HEIGHT +
          tableSizes.COLUMN_HEADER_HEIGHT +
          tableSizes.ROW_HEIGHT * pageSize) >
      0
    )
      pageSize += 1;

    if (pageSize !== this.props.pageSize) {
      this.props.updateWidgetMetaProperty("pageSize", pageSize);
    }
    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          height={componentHeight}
          width={componentWidth}
          tableData={transformedData}
          columns={tableColumns}
          isLoading={this.props.isLoading}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          searchKey={this.props.searchText}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          hiddenColumns={hiddenColumns}
          columnActions={this.props.columnActions}
          columnOrder={this.props.columnOrder}
          pageSize={pageSize}
          onCommandClick={this.onCommandClick}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          multiRowSelection={this.props.multiRowSelection}
          selectedRowIndices={selectedRowIndices}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          onRowClick={this.handleRowClick}
          pageNo={pageNo}
          nextPageClick={this.handleNextPageClick}
          prevPageClick={this.handlePrevPageClick}
          primaryColumns={this.props.primaryColumns}
          updatePrimaryColumnProperties={(
            columnProperties: ColumnProperties[],
          ) => {
            super.updateWidgetProperty("primaryColumns", columnProperties);
          }}
          updatePageNo={this.updatePageNumber}
          updateHiddenColumns={(hiddenColumns?: string[]) => {
            super.updateWidgetProperty("hiddenColumns", hiddenColumns);
          }}
          handleReorderColumn={(columnOrder: string[]) => {
            super.updateWidgetProperty("columnOrder", columnOrder);
          }}
          disableDrag={(disable: boolean) => {
            this.disableDrag(disable);
          }}
          searchTableData={this.handleSearchTable}
          filters={this.props.filters}
          applyFilter={(filters: ReactTableFilter[]) => {
            this.resetSelectedRowIndex();
            this.props.updateWidgetMetaProperty("filters", filters);
          }}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          updateCompactMode={(compactMode: CompactMode) => {
            if (this.props.renderMode === RenderModes.CANVAS) {
              this.props.updateWidgetMetaProperty("compactMode", compactMode);
            } else {
              this.props.updateWidgetMetaProperty("compactMode", compactMode);
            }
          }}
          sortTableColumn={this.handleColumnSorting}
        />
      </Suspense>
    );
  }

  handleColumnSorting = (column: string, asc: boolean) => {
    this.resetSelectedRowIndex();
    if (column === "") {
      this.props.updateWidgetMetaProperty("sortedColumn", undefined);
    } else {
      this.props.updateWidgetMetaProperty("sortedColumn", {
        column: column,
        asc: asc,
      });
    }
  };

  handleSearchTable = (searchKey: any) => {
    const { onSearchTextChanged } = this.props;
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("pageNo", 1);
    this.props.updateWidgetMetaProperty("searchText", searchKey, {
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });
  };

  updateHiddenColumns = (hiddenColumns?: string[]) => {
    super.updateWidgetProperty("hiddenColumns", hiddenColumns);
  };

  onCommandClick = (action: string, onComplete: () => void) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_CLICK,
        callback: onComplete,
      },
    });
  };

  onItemSelect = (action: string) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  handleRowClick = (rowData: Record<string, unknown>, index: number) => {
    const { selectedRowIndices } = this.props;
    if (this.props.multiRowSelection) {
      if (selectedRowIndices.includes(index)) {
        const rowIndex = selectedRowIndices.indexOf(index);
        selectedRowIndices.splice(rowIndex, 1);
      } else {
        selectedRowIndices.push(index);
      }
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
      this.props.updateWidgetMetaProperty(
        "selectedRows",
        this.props.filteredTableData.filter(
          (item: Record<string, unknown>, i: number) => {
            return selectedRowIndices.includes(i);
          },
        ),
      );
    } else {
      this.props.updateWidgetMetaProperty("selectedRowIndex", index);
      this.props.updateWidgetMetaProperty(
        "selectedRow",
        this.props.filteredTableData[index],
        {
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        },
      );
    }
  };

  updatePageNumber = (pageNo: number, event?: EventType) => {
    if (event) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        dynamicString: this.props.onPageChange,
        event: {
          type: event,
        },
      });
    } else {
      this.props.updateWidgetMetaProperty("pageNo", pageNo);
    }
    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
    }
  };

  handleNextPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo + 1;
    this.props.updateWidgetMetaProperty("pageNo", pageNo, {
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_NEXT_PAGE,
      },
    });
    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
    }
  };

  resetSelectedRowIndex = () => {
    this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
    this.props.updateWidgetMetaProperty("selectedRowIndices", []);
  };

  handlePrevPageClick = () => {
    let pageNo = this.props.pageNo || 1;
    pageNo = pageNo - 1;
    if (pageNo >= 1) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        dynamicString: this.props.onPageChange,
        event: {
          type: EventType.ON_PREV_PAGE,
        },
      });
      if (this.props.onPageChange) {
        this.resetSelectedRowIndex();
      }
    }
  };

  getWidgetType(): WidgetType {
    return "TABLE_WIDGET";
  }
}

export type CompactMode = keyof typeof CompactModeTypes;
export type Condition = keyof typeof ConditionFunctions | "";
export type Operator = keyof typeof OperatorTypes;
export type CellAlignment = keyof typeof CellAlignmentTypes;
export type VerticalAlignment = keyof typeof VerticalAlignmentTypes;
export type FontStyle = keyof typeof FontStyleTypes;
export type TextSize = keyof typeof TextSizes;

export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  value: any;
}

export interface CellLayoutProperties {
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: TextSize;
  fontStyle?: FontStyle;
  textColor?: string;
  cellBackground?: string;
  buttonStyle?: string;
  buttonLabelColor?: string;
  buttonLabel?: string;
}

export interface TableColumnMetaProps {
  isHidden: boolean;
  format?: string;
  inputFormat?: string;
  type: string;
}

export interface ReactTableColumnProps {
  Header: string;
  accessor: string;
  width: number;
  minWidth: number;
  draggable: boolean;
  isHidden?: boolean;
  isAscOrder?: boolean;
  metaProperties?: TableColumnMetaProps;
  isDerived?: boolean;
  columnProperties: string;
  Cell: (props: any) => JSX.Element;
}

export interface ColumnProperties {
  id: string;
  label: string;
  columnType: string;
  isVisible: boolean;
  index: number;
  width: number;
  cellBackground?: string;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: TextSize;
  fontStyle?: FontStyle;
  textColor?: string;
  enableFilter?: boolean;
  enableSort?: boolean;
  isDerived: boolean;
  computedValue: string;
  buttonLabel?: string;
  buttonStyle?: string;
  buttonLabelColor?: string;
  onClick?: string;
  outputFormat?: string;
  inputFormat?: string;
  dropdownOptions?: string;
  onOptionChange?: string;
}

export interface TableWidgetProps extends WidgetProps, WithMeta {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchText: string;
  defaultSearchText: string;
  tableData: Array<Record<string, unknown>>;
  onPageChange?: string;
  pageSize: number;
  onRowSelected?: string;
  onSearchTextChanged: string;
  selectedRowIndex?: number;
  selectedRowIndices: number[];
  columnActions?: ColumnAction[];
  serverSidePaginationEnabled?: boolean;
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  columnOrder?: string[];
  columnNameMap?: { [key: string]: string };
  columnTypeMap?: {
    [key: string]: { type: string; format: string; inputFormat?: string };
  };
  columnSizeMap?: { [key: string]: number };
  filters?: ReactTableFilter[];
  compactMode?: CompactMode;
  derivedColumns?: ColumnProperties[];
  primaryColumns?: ColumnProperties[];
  sortedColumn?: {
    column: string;
    asc: boolean;
  };
}

export default TableWidget;
export const ProfiledTableWidget = Sentry.withProfiler(withMeta(TableWidget));
