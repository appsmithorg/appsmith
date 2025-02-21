import {
  createMessage,
  TABLE_WIDGET_TOTAL_RECORD_TOOLTIP,
} from "ee/constants/messages";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING } from "../../constants";
import { InlineEditingSaveOptions } from "widgets/TableWidgetV2/constants";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";
import {
  tableDataValidation,
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnOrderHook,
  updateCustomColumnAliasOnLabelChange,
  updateInlineEditingOptionDropdownVisibilityHook,
  updateInlineEditingSaveOptionHook,
} from "../propertyUtils";
import panelConfig from "./PanelConfig";
import Widget from "../index";
import { INFINITE_SCROLL_ENABLED } from "../../constants";

export default [
  {
    sectionName: "Data",
    children: [
      {
        helpText:
          "Takes in an array of objects to display rows in the table. Bind data from an API using {{}}",
        propertyName: "tableData",
        label: "Table data",
        controlType: "ONE_CLICK_BINDING_CONTROL",
        controlConfig: {
          searchableColumn: true,
        },
        placeholderText: '[{ "name": "John" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: tableDataValidation,
            expected: {
              type: "Array",
              example: `[{ "name": "John" }]`,
              autocompleteDataType: AutocompleteDataType.ARRAY,
            },
          },
        },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
        shouldSwitchToNormalMode: (
          isDynamic: boolean,
          isToggleDisabled: boolean,
          triggerFlag?: boolean,
        ) => triggerFlag && isDynamic && !isToggleDisabled,
      },
      {
        propertyName: "primaryColumns",
        controlType: "PRIMARY_COLUMNS_V2",
        label: "Columns",
        updateHook: composePropertyUpdateHook([
          updateColumnOrderHook,
          updateInlineEditingOptionDropdownVisibilityHook,
          updateCustomColumnAliasOnLabelChange,
        ]),
        dependencies: [
          "primaryColumns",
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
              type: "Unique column names",
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
        label: "Update mode",
        controlType: "ICON_TABS",
        defaultValue: InlineEditingSaveOptions.ROW_LEVEL,
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
    // Added this prop to indicate that data section needs to be expanded by default
    // Rest all sections needs to be collapsed
    // We already have a isDefaultOpen prop configured to keep a section expanded or not
    // but introducing new prop so that we can control is based on flag
    // Once we decide to keep this feature, we can go back to using isDefaultOpen and removeexpandedByDefault
    expandedByDefault: true,
  },
  {
    sectionName: "Pagination",
    children: [
      {
        propertyName: "isVisiblePagination",
        helpText: "Toggle visibility of the pagination",
        label: "Show pagination",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: TableWidgetProps) => props.infiniteScrollEnabled,
        dependencies: ["infiniteScrollEnabled"],
      },
      {
        helpText:
          "Bind the Table.pageNo property in your API and call it onPageChange",
        propertyName: "serverSidePaginationEnabled",
        label: "Server side pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText:
          "Bind the Table.pageNo property in your API and call it onPageChange",
        propertyName: "infiniteScrollEnabled",
        label: "Infinite scroll",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: () => !Widget.getFeatureFlag(INFINITE_SCROLL_ENABLED),
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
        helpText: "when a table page is changed",
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
        helpText: "when a table page size is changed",
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
    expandedByDefault: false,
  },
  {
    sectionName: "Search & filters",
    children: [
      {
        propertyName: "isVisibleSearch",
        helpText: "Toggle visibility of the search box",
        label: "Allow searching",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "enableClientSideSearch",
        label: "Client side search",
        helpText: "Searches all results only on the data which is loaded",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        hidden: (props: TableWidgetProps) => !props.isVisibleSearch,
        dependencies: ["isVisibleSearch"],
      },
      {
        propertyName: "enableServerSideFiltering",
        label: "Server side filtering",
        helpText: "Filters all the results on the server side",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
        defaultValue: false,
        hidden: () =>
          !Widget.getFeatureFlag(ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING),
      },
      {
        propertyName: "onTableFilterUpdate",
        label: "onTableFilterUpdate",
        helpText: "when table filter is modified by the user",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: TableWidgetProps) => !props.enableServerSideFiltering,
        dependencies: ["enableServerSideFiltering"],
      },
      {
        propertyName: "defaultSearchText",
        label: "Default search text",
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
        helpText: "when search text is modified by the user",
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
        label: "Allow filtering",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
    expandedByDefault: false,
  },
  {
    sectionName: "Row selection",
    children: [
      {
        helpText: "Selects row(s) by default",
        propertyName: "defaultSelectedRowIndices",
        label: "Default selected rows",
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
        label: "Default selected row",
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
        label: "Enable multi-row selection",
        helpText: "Allows users to select multiple rows",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "when a table row is selected",
        propertyName: "onRowSelected",
        label: "onRowSelected",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
    expandedByDefault: false,
  },
  {
    sectionName: "Sorting",
    children: [
      {
        helpText: "Controls sorting in View Mode",
        propertyName: "isSortable",
        isJSConvertible: true,
        label: "Column sorting",
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
        helpText: "when a table column is sorted",
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
    expandedByDefault: false,
  },
  {
    sectionName: "Adding a row",
    children: [
      {
        propertyName: "allowAddNewRow",
        helpText: "Enables adding a new row",
        isJSConvertible: true,
        label: "Allow adding a row",
        controlType: "SWITCH",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "onAddNewRowSave",
        helpText: "when a add new row save button is clicked",
        label: "onSave",
        controlType: "ACTION_SELECTOR",
        hidden: (props: TableWidgetProps) => {
          return !props.allowAddNewRow;
        },
        dependencies: ["allowAddNewRow", "primaryColumns"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: (props: TableWidgetProps) => {
          const newRow: Record<string, unknown> = {};

          if (props.primaryColumns) {
            Object.values(props.primaryColumns)
              .filter((column) => !column.isDerived)
              .forEach((column) => {
                newRow[column.alias] = "";
              });
          }

          return {
            newRow,
          };
        },
      },
      {
        propertyName: "onAddNewRowDiscard",
        helpText: "when a add new row discard button is clicked",
        label: "onDiscard",
        controlType: "ACTION_SELECTOR",
        hidden: (props: TableWidgetProps) => {
          return !props.allowAddNewRow;
        },
        dependencies: ["allowAddNewRow"],
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        propertyName: "defaultNewRow",
        helpText: "Default new row values",
        label: "Default values",
        controlType: "INPUT_TEXT",
        dependencies: ["allowAddNewRow"],
        hidden: (props: TableWidgetProps) => {
          return !props.allowAddNewRow;
        },
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.OBJECT,
          params: {
            default: {},
          },
        },
      },
    ],
    expandedByDefault: false,
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
        label: "Animate loading",
        controlType: "SWITCH",
        helpText: "Controls the animation loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "customIsLoading",
        label: `Custom loading state`,
        controlType: "SWITCH",
        helpText: "Defines a custom value for the loading state",
        defaultValue: false,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "customIsLoadingValue",
        label: "isLoading value",
        controlType: "INPUT_TEXT",
        defaultValue: "",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (props: TableWidgetProps) => !props.customIsLoading,
        dependencies: ["customIsLoading"],
      },
      {
        propertyName: "isVisibleDownload",
        helpText: "Toggle visibility of the data download",
        label: "Allow download",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "canFreezeColumn",
        helpText: "Controls whether the user can freeze columns",
        label: "Allow column freeze",
        controlType: "SWITCH",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        propertyName: "delimiter",
        label: "CSV separator",
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
    expandedByDefault: false,
  },
] as PropertyPaneConfig[];
