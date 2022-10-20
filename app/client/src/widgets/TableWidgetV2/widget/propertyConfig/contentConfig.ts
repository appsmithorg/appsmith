import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import {
  InlineEditingSaveOptions,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnOrderHook,
  updateInlineEditingSaveOptionHook,
  updateInlineEditingOptionDropdownVisibilityHook,
} from "../propertyUtils";
import {
  createMessage,
  TABLE_WIDGET_TOTAL_RECORD_TOOLTIP,
} from "@appsmith/constants/messages";
import panelConfig from "./PanelConfig";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";

export default [
  {
    sectionName: "Data",
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
        controlType: "PRIMARY_COLUMNS_V2",
        label: "Columns",
        updateHook: composePropertyUpdateHook([
          updateColumnOrderHook,
          updateInlineEditingOptionDropdownVisibilityHook,
        ]),
        dependencies: [
          "columnOrder",
          "childStylesheet",
          "inlineEditingSaveOption",
          "textColor",
          "textSize",
          "fontStyle",
          "cellBackground",
          "verticalAlignment",
          "horizontalAlignment",
        ],
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
        panelConfig,
      },
      {
        propertyName: "inlineEditingSaveOption",
        helpText: "Choose the save experience to save the edited cell",
        label: "Update Mode",
        controlType: "ICON_TABS",
        fullWidth: true,
        isBindProperty: true,
        isTriggerProperty: false,
        hidden: (props: TableWidgetProps) => {
          return (
            !props.showInlineEditingOptionDropdown &&
            !Object.values(props.primaryColumns).find(
              (column) => column.isEditable,
            )
          );
        },
        dependencies: [
          "primaryColumns",
          "columnOrder",
          "childStylesheet",
          "showInlineEditingOptionDropdown",
        ],
        options: [
          {
            label: "Single Row",
            value: InlineEditingSaveOptions.ROW_LEVEL,
          },
          {
            label: "Multi Row",
            value: InlineEditingSaveOptions.CUSTOM,
          },
        ],
        updateHook: updateInlineEditingSaveOptionHook,
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
    ],
  },
  {
    sectionName: "Pagination",
    children: [
      {
        propertyName: "isVisiblePagination",
        helpText: "Toggle visibility of the pagination",
        label: "Show Pagination",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
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
        label: "Total Records",
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
        hidden: (props: TableWidgetProps) => !props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
      {
        helpText: "Triggers an action when a table page is changed",
        propertyName: "onPageChange",
        label: "onPageChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: TableWidgetProps) => !props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
      {
        helpText: "Triggers an action when a table page size is changed",
        propertyName: "onPageSizeChange",
        label: "onPageSizeChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: TableWidgetProps) => !props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
    ],
  },
  {
    sectionName: "Search & Filters",
    children: [
      {
        propertyName: "isVisibleSearch",
        helpText: "Toggle visibility of the search box",
        label: "Allow Searching",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "enableClientSideSearch",
        label: "Client Side Search",
        helpText: "Searches all results only on the data which is loaded",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: TableWidgetProps) => !props.isVisibleSearch,
        dependencies: ["isVisibleSearch"],
      },
      {
        propertyName: "defaultSearchText",
        label: "Default Search Text",
        helpText: "Adds a search text by default",
        controlType: "INPUT_TEXT",
        placeholderText: "{{appsmith.user.name}}",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
        hidden: (props: TableWidgetProps) => !props.isVisibleSearch,
        dependencies: ["isVisibleSearch"],
      },
      {
        propertyName: "onSearchTextChanged",
        label: "onSearchTextChanged",
        helpText: "Triggers an action when search text is modified by the user",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: TableWidgetProps) => !props.isVisibleSearch,
        dependencies: ["isVisibleSearch"],
      },
      {
        propertyName: "isVisibleFilters",
        helpText: "Toggle visibility of the filters",
        label: "Allow Filtering",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Row Selection",
    children: [
      {
        helpText: "Selects row(s) by default",
        propertyName: "defaultSelectedRowIndices",
        label: "Default Selected Rows",
        controlType: "INPUT_TEXT",
        placeholderText: "[0]",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.ARRAY,
          params: {
            children: {
              type: ValidationTypes.NUMBER,
              params: {
                min: -1,
                default: -1,
              },
            },
          },
        },
        hidden: (props: TableWidgetProps) => {
          return !props.multiRowSelection;
        },
        dependencies: ["multiRowSelection"],
      },
      {
        helpText: "Selects row by default",
        propertyName: "defaultSelectedRowIndex",
        label: "Default Selected Row",
        controlType: "INPUT_TEXT",
        defaultValue: 0,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: -1,
            default: -1,
          },
        },
        hidden: (props: TableWidgetProps) => {
          return props.multiRowSelection;
        },
        dependencies: ["multiRowSelection"],
      },
      {
        propertyName: "multiRowSelection",
        label: "Enable Multi-row Selection",
        helpText: "Allows users to select multiple rows",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Triggers an action when a table row is selected",
        propertyName: "onRowSelected",
        label: "onRowSelected",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
  {
    sectionName: "Sorting",
    children: [
      {
        helpText: "Controls sorting in View Mode",
        propertyName: "isSortable",
        isJSConvertible: true,
        label: "Column Sorting",
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
        helpText: "Triggers an action when a table column is sorted",
        propertyName: "onSort",
        label: "onSort",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: TableWidgetProps) => !props.isSortable,
        dependencies: ["isSortable"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
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
        propertyName: "isVisibleDownload",
        helpText: "Toggle visibility of the data download",
        label: "Allow Download",
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
] as PropertyPaneConfig[];
