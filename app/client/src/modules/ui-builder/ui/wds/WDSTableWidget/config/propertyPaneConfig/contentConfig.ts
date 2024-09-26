import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { TableWidgetProps } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { InlineEditingSaveOptions } from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";
import {
  tableDataValidation,
  uniqueColumnNameValidation,
  updateColumnOrderHook,
  updateCustomColumnAliasOnLabelChange,
  updateInlineEditingOptionDropdownVisibilityHook,
  updateInlineEditingSaveOptionHook,
} from "../../widget/propertyUtils";
import panelConfig from "./PanelConfig";

export const contentConfig = [
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
          maxHeight: "300px",
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
        controlType: "PRIMARY_COLUMNS_WDS",
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
          "type",
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
  },
  {
    sectionName: "Pagination",
    children: [
      {
        propertyName: "pageSize",
        helpText: "Number of rows to be displayed at a time",
        label: "Page size",
        controlType: "NUMERIC_INPUT",
        isJSConvertible: true,
        defaultValue: 10,
        isBindProperty: true,
        isTriggerProperty: false,
        min: 1,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 1,
          },
        },
      },
      {
        propertyName: "isVisiblePagination",
        helpText: "Toggle visibility of the pagination",
        label: "Show pagination",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
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
    ],
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
        helpText: "Controls the loading of the widget",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
] as PropertyPaneConfig[];
