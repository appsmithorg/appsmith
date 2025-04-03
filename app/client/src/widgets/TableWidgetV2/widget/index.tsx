import log from "loglevel";
import memoizeOne from "memoize-one";
import React, { lazy, Suspense } from "react";

import _, {
  filter,
  isArray,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isString,
  merge,
  orderBy,
  pickBy,
  union,
  without,
  xor,
  xorWith,
} from "lodash";

import type { IconName } from "@blueprintjs/icons";
import { IconNames } from "@blueprintjs/icons";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import Skeleton from "components/utils/Skeleton";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import {
  RenderModes,
  WIDGET_PADDING,
  WIDGET_TAGS,
} from "constants/WidgetConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import equal from "fast-deep-equal/es6";
import {
  FlexVerticalAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { noop, retryPromise } from "utils/AppsmithUtils";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { klonaRegularWithTelemetry } from "utils/helpers";
import localStorage from "utils/localStorage";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";
import type { MenuItem } from "widgets/MenuButtonWidget/constants";
import { MenuItemsSource } from "widgets/MenuButtonWidget/constants";
import {
  DefaultAutocompleteDefinitions,
  sanitizeKey,
} from "widgets/WidgetUtils";
import { ButtonCell } from "../component/cellComponents/ButtonCell";
import { CheckboxCell } from "../component/cellComponents/CheckboxCell";
import { DateCell } from "../component/cellComponents/DateCell";
import { EditActionCell } from "../component/cellComponents/EditActionsCell";
import HTMLCell from "../component/cellComponents/HTMLCell";
import { IconButtonCell } from "../component/cellComponents/IconButtonCell";
import { ImageCell } from "../component/cellComponents/ImageCell";
import { MenuButtonCell } from "../component/cellComponents/MenuButtonCell";
import PlainTextCell from "../component/cellComponents/PlainTextCell";
import { SelectCell } from "../component/cellComponents/SelectCell";
import { SwitchCell } from "../component/cellComponents/SwitchCell";
import { VideoCell } from "../component/cellComponents/VideoCell";
import type {
  ColumnProperties,
  ReactTableColumnProps,
  ReactTableFilter,
} from "../component/Constants";
import {
  AddNewRowActions,
  CompactModeTypes,
  DEFAULT_FILTER,
  SORT_ORDER,
  SortOrderTypes,
  StickyType,
} from "../component/Constants";
import { CellWrapper } from "../component/TableStyledWrappers";
import type {
  EditableCell,
  OnColumnEventArgs,
  TableWidgetProps,
  TransientDataPayload,
} from "../constants";
import {
  ActionColumnTypes,
  ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING,
  ColumnTypes,
  DEFAULT_BUTTON_LABEL,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MENU_BUTTON_LABEL,
  DEFAULT_MENU_VARIANT,
  defaultEditableCell,
  EditableCellActions,
  InlineEditingSaveOptions,
  ORIGINAL_INDEX_KEY,
  PaginationDirection,
  TABLE_COLUMN_ORDER_KEY,
} from "../constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import derivedProperties from "./parseDerivedProperties";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import type { getColumns } from "./reactTableUtils/getColumnsPureFn";
import { getMemoiseGetColumnsWithLocalStorageFn } from "./reactTableUtils/getColumnsPureFn";
import type {
  tableData,
  transformDataWithEditableCell,
} from "./reactTableUtils/transformDataPureFn";
import { getMemoiseTransformDataWithEditableCell } from "./reactTableUtils/transformDataPureFn";
import {
  createEditActionColumn,
  deleteLocalTableColumnOrderByWidgetId,
  generateLocalNewColumnOrderFromStickyValue,
  generateNewColumnOrderFromStickyValue,
  getAllStickyColumnsCount,
  getAllTableColumnKeys,
  getBooleanPropertyValue,
  getCellProperties,
  getColumnOrderByWidgetIdFromLS,
  getColumnType,
  getDefaultColumnProperties,
  getDerivedColumns,
  getSelectRowIndex,
  getSelectRowIndices,
  getTableStyles,
  isColumnTypeEditable,
  updateAndSyncTableLocalColumnOrders,
} from "./utilities";

const ReactTableComponent = lazy(async () =>
  retryPromise(async () => import("../component")),
);

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyArr: any = [];

type addNewRowToTable = (
  tableData: tableData,
  isAddRowInProgress: boolean,
  newRowContent: Record<string, unknown>,
) => tableData;

const getMemoisedAddNewRow = (): addNewRowToTable =>
  memoizeOne((tableData, isAddRowInProgress, newRowContent) => {
    if (isAddRowInProgress) {
      return [newRowContent, ...tableData];
    }

    return tableData;
  });

class TableWidgetV2 extends BaseWidget<TableWidgetProps, WidgetState> {
  inlineEditTimer: number | null = null;
  memoisedAddNewRow: addNewRowToTable;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memoiseGetColumnsWithLocalStorage: (localStorage: any) => getColumns;
  memoiseTransformDataWithEditableCell: transformDataWithEditableCell;

  static type = "TABLE_WIDGET_V2";

  static getConfig() {
    return {
      name: "Table",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      needsHeightForContent: true,
    };
  }

  static getDefaults() {
    return {
      flexVerticalAlignment: FlexVerticalAlignment.Top,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      rows: 28,
      canFreezeColumn: true,
      columnUpdatedAt: Date.now(),
      columns: 34,
      animateLoading: true,
      defaultSelectedRowIndex: 0,
      defaultSelectedRowIndices: [0],
      label: "Data",
      widgetName: "Table",
      searchKey: "",
      textSize: "0.875rem",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      totalRecordsCount: 0,
      defaultPageSize: 0,
      dynamicPropertyPathList: [],
      borderColor: Colors.GREY_5,
      borderWidth: "1",
      dynamicBindingPathList: [],
      primaryColumns: {},
      tableData: "",
      columnWidthMap: {},
      columnOrder: [],
      enableClientSideSearch: true,
      isVisibleSearch: true,
      isVisibleFilters: false,
      isVisibleDownload: true,
      isVisiblePagination: true,
      isSortable: true,
      delimiter: ",",
      version: 2,
      inlineEditingSaveOption: InlineEditingSaveOptions.ROW_LEVEL,
      enableServerSideFiltering: TableWidgetV2.getFeatureFlag(
        ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING,
      )
        ? false
        : undefined,
      customIsLoading: false,
      customIsLoadingValue: "",
      cachedTableData: {},
      endOfData: false,
    };
  }

  static getMethods() {
    return {
      getQueryGenerationConfig: (widget: WidgetProps) => {
        return {
          select: {
            limit: `${widget.widgetName}.pageSize`,
            where: `${widget.widgetName}.searchText`,
            offset: `${widget.widgetName}.pageOffset`,
            orderBy: `${widget.widgetName}.sortOrder.column`,
            sortOrder: `${widget.widgetName}.sortOrder.order !== "desc"`,
          },
          create: {
            value: `(${widget.widgetName}.newRow || {})`,
          },
          update: {
            value: `${widget.widgetName}.updatedRow`,
            where: `${widget.widgetName}.updatedRow`,
          },
          totalRecord: true,
        };
      },
      getPropertyUpdatesForQueryBinding: (
        queryConfig: WidgetQueryConfig,
        _widget: WidgetProps,
        formConfig: WidgetQueryGenerationFormConfig,
      ) => {
        const widget = _widget as TableWidgetProps;

        let modify = {};
        const dynamicPropertyPathList: DynamicPath[] = [];

        if (queryConfig.select) {
          modify = merge(modify, {
            tableData: queryConfig.select.data,
            onPageChange: queryConfig.select.run,
            serverSidePaginationEnabled: true,
            onSearchTextChanged: formConfig.searchableColumn
              ? queryConfig.select.run
              : undefined,
            onSort: queryConfig.select.run,
            enableClientSideSearch: !formConfig.searchableColumn,
            primaryColumnId: formConfig.primaryColumn,
            isVisibleDownload: false,
          });

          dynamicPropertyPathList.push({ key: "tableData" });
        }

        if (queryConfig.create) {
          modify = merge(modify, {
            onAddNewRowSave: queryConfig.create.run,
            allowAddNewRow: true,
            ...Object.keys(widget.primaryColumns).reduce(
              (prev: Record<string, boolean>, curr) => {
                if (formConfig.primaryColumn !== curr) {
                  prev[`primaryColumns.${curr}.isEditable`] = true;
                  prev[`primaryColumns.${curr}.isCellEditable`] = true;
                }

                prev[`showInlineEditingOptionDropdown`] = true;

                return prev;
              },
              {},
            ),
          });
        }

        if (queryConfig.update) {
          let editAction = {};

          if (
            !Object.values(widget.primaryColumns).some(
              (column) => column.columnType === ColumnTypes.EDIT_ACTIONS,
            )
          ) {
            editAction = Object.values(createEditActionColumn(widget)).reduce(
              (
                prev: Record<string, unknown>,
                curr: {
                  propertyPath: string;
                  propertyValue: unknown;
                  isDynamicPropertyPath?: boolean;
                },
              ) => {
                prev[curr.propertyPath] = curr.propertyValue;

                if (curr.isDynamicPropertyPath) {
                  dynamicPropertyPathList.push({ key: curr.propertyPath });
                }

                return prev;
              },
              {},
            );
          }

          modify = merge(modify, {
            ...editAction,
            [`primaryColumns.EditActions1.onSave`]: queryConfig.update.run,
          });
        }

        if (queryConfig.total_record) {
          modify = merge(modify, {
            totalRecordsCount: queryConfig.total_record.data,
          });
        }

        return {
          modify,
          dynamicUpdates: {
            dynamicPropertyPathList,
          },
        };
      },
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "tableData",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: !!propValueMap.isDynamicPropertyPath,
          },
        ];
      },
      getOneClickBindingConnectableWidgetConfig: (widget: WidgetProps) => {
        return {
          widgetBindPath: `${widget.widgetName}.selectedRow`,
          message: `Make sure ${widget.widgetName} is bound to the same data source`,
        };
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  constructor(props: TableWidgetProps) {
    super(props);
    // generate new cache instances so that each table widget instance has its own respective cache instance
    this.memoisedAddNewRow = getMemoisedAddNewRow();
    this.memoiseGetColumnsWithLocalStorage =
      getMemoiseGetColumnsWithLocalStorageFn();
    this.memoiseTransformDataWithEditableCell =
      getMemoiseTransformDataWithEditableCell();
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      selectedRowIndex: undefined,
      selectedRowIndices: undefined,
      searchText: undefined,
      triggeredRowIndex: undefined,
      filters: [],
      sortOrder: {
        column: "",
        order: null,
      },
      transientTableData: {},
      updatedRowIndex: -1,
      editableCell: defaultEditableCell,
      columnEditableCellValue: {},
      selectColumnFilterText: {},
      isAddRowInProgress: false,
      newRowContent: undefined,
      newRow: undefined,
      previousPageVisited: false,
      nextPageVisited: false,
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: TableWidgetProps, extraDefsToDefine?: ExtraDef) => {
      const config: AutocompletionDefinitions = {
        "!doc":
          "The Table is the hero widget of Appsmith. You can display data from an API in a table, trigger an action when a user selects a row and even work with large paginated data sets",
        "!url": "https://docs.appsmith.com/widget-reference/table",
        selectedRow: generateTypeDef(widget.selectedRow, extraDefsToDefine),
        selectedRows: generateTypeDef(widget.selectedRows, extraDefsToDefine),
        selectedRowIndices: generateTypeDef(widget.selectedRowIndices),
        triggeredRow: generateTypeDef(widget.triggeredRow),
        updatedRow: generateTypeDef(widget.updatedRow),
        selectedRowIndex: "number",
        tableData: generateTypeDef(widget.tableData, extraDefsToDefine),
        pageNo: "number",
        pageSize: "number",
        isVisible: DefaultAutocompleteDefinitions.isVisible,
        searchText: "string",
        totalRecordsCount: "number",
        sortOrder: {
          column: "string",
          order: ["asc", "desc"],
        },
        updatedRows: generateTypeDef(widget.updatedRows, extraDefsToDefine),
        updatedRowIndices: generateTypeDef(widget.updatedRowIndices),
        triggeredRowIndex: generateTypeDef(widget.triggeredRowIndex),
        pageOffset: generateTypeDef(widget.pageOffset),
        tableHeaders: generateTypeDef(widget.tableHeaders),
        newRow: generateTypeDef(widget.newRow),
        isAddRowInProgress: "bool",
        previousPageVisited: generateTypeDef(widget.previousPageVisited),
        nextPageVisited: generateTypeDef(widget.nextPageButtonClicked),
      };

      if (this.getFeatureFlag(ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING)) {
        config["filters"] = generateTypeDef(widget.filters);
      }

      return config;
    };
  }

  static getDerivedPropertiesMap() {
    return {
      selectedRow: `{{(()=>{${derivedProperties.getSelectedRow}})()}}`,
      triggeredRow: `{{(()=>{${derivedProperties.getTriggeredRow}})()}}`,
      selectedRows: `{{(()=>{${derivedProperties.getSelectedRows}})()}}`,
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
      triggerRowSelection: "{{!!this.onRowSelected}}",
      processedTableData: `{{(()=>{${derivedProperties.getProcessedTableData}})()}}`,
      orderedTableColumns: `{{(()=>{${derivedProperties.getOrderedTableColumns}})()}}`,
      filteredTableData: `{{(()=>{ ${derivedProperties.getFilteredTableData}})()}}`,
      updatedRows: `{{(()=>{ ${derivedProperties.getUpdatedRows}})()}}`,
      updatedRowIndices: `{{(()=>{ ${derivedProperties.getUpdatedRowIndices}})()}}`,
      updatedRow: `{{(()=>{ ${derivedProperties.getUpdatedRow}})()}}`,
      pageOffset: `{{(()=>{${derivedProperties.getPageOffset}})()}}`,
      isEditableCellsValid: `{{(()=>{ ${derivedProperties.getEditableCellValidity}})()}}`,
      tableHeaders: `{{(()=>{${derivedProperties.getTableHeaders}})()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRowIndex",
      selectedRowIndices: "defaultSelectedRowIndices",
    };
  }

  static getLoadingProperties(): Array<RegExp> | undefined {
    return [/\.tableData$/];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      childStylesheet: {
        button: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        menuButton: {
          menuColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        iconButton: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        editActions: {
          saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
          saveBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
          discardBorderRadius:
            "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
      },
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "string",
        },
        setSelectedRowIndex: {
          path: "defaultSelectedRowIndex",
          type: "number",
          disabled: "return options.entity.multiRowSelection",
        },
        setSelectedRowIndices: {
          path: "defaultSelectedRowIndices",
          type: "array",
          disabled: "return !options.entity.multiRowSelection",
        },
        setData: {
          path: "tableData",
          type: "array",
        },
      },
    };
  }

  /*
   * Function to get the table columns with appropriate render functions
   * based on columnType
   */
  getTableColumns = () => {
    const {
      columnWidthMap,
      isPreviewMode,
      orderedTableColumns,
      renderMode,
      widgetId,
    } = this.props;
    const { componentWidth } = this.getPaddingAdjustedDimensions();
    const widgetLocalStorageState = getColumnOrderByWidgetIdFromLS(widgetId);
    const memoisdGetColumnsWithLocalStorage =
      this.memoiseGetColumnsWithLocalStorage(widgetLocalStorageState);

    return memoisdGetColumnsWithLocalStorage(
      this.renderCell,
      columnWidthMap,
      orderedTableColumns,
      componentWidth,
      renderMode,
      isPreviewMode,
    );
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    return this.memoiseTransformDataWithEditableCell(
      this.props.editableCell,
      tableData,
      columns,
    );
  };

  updateDerivedColumnsIndex = (
    derivedColumns: Record<string, ColumnProperties>,
    tableColumnCount: number,
  ) => {
    if (!derivedColumns) {
      return [];
    }

    //update index property of all columns in new derived columns
    return Object.values(derivedColumns).map(
      (column: ColumnProperties, index: number) => {
        return {
          ...column,
          index: index + tableColumnCount,
        };
      },
    );
  };

  /*
   * Function to create new primary Columns from the tableData
   * gets called on component mount and on component update
   */
  createTablePrimaryColumns = ():
    | Record<string, ColumnProperties>
    | undefined => {
    const { primaryColumns = {}, tableData = [] } = this.props;

    if (!_.isArray(tableData) || tableData.length === 0) {
      return;
    }

    const existingColumnIds = Object.keys(primaryColumns);
    const newTableColumns: Record<string, ColumnProperties> = {};
    const tableStyles = getTableStyles(this.props);
    const columnKeys: string[] = getAllTableColumnKeys(tableData);

    /*
     * Generate default column properties for all columns
     * But do not replace existing columns with the same id
     */
    columnKeys.forEach((columnKey, index) => {
      const existingColumn = this.getColumnByOriginalId(columnKey);

      if (!!existingColumn) {
        // Use the existing column properties
        newTableColumns[existingColumn.id] = existingColumn;
      } else {
        const hashedColumnKey = sanitizeKey(columnKey, {
          existingKeys: union(existingColumnIds, Object.keys(newTableColumns)),
        });
        // Create column properties for the new column
        const columnType = getColumnType(tableData, columnKey);
        const columnProperties = getDefaultColumnProperties(
          columnKey,
          hashedColumnKey,
          index,
          this.props.widgetName,
          false,
          columnType,
        );

        newTableColumns[columnProperties.id] = {
          ...columnProperties,
          ...tableStyles,
        };
      }
    });

    const derivedColumns: Record<string, ColumnProperties> =
      getDerivedColumns(primaryColumns);

    const updatedDerivedColumns = this.updateDerivedColumnsIndex(
      derivedColumns,
      Object.keys(newTableColumns).length,
    );

    //add derived columns to new Table columns
    updatedDerivedColumns.forEach((derivedColumn: ColumnProperties) => {
      newTableColumns[derivedColumn.id] = derivedColumn;
    });

    const newColumnIds = Object.keys(newTableColumns);

    // check if the columns ids differ
    if (_.xor(existingColumnIds, newColumnIds).length > 0) {
      return newTableColumns;
    } else {
      return;
    }
  };

  /*
   * Function to update primaryColumns when the tablData schema changes
   */
  updateColumnProperties = (
    tableColumns?: Record<string, ColumnProperties>,
    shouldPersistLocalOrderWhenTableDataChanges = false,
  ) => {
    const { columnOrder = [], primaryColumns = {} } = this.props;
    const derivedColumns = getDerivedColumns(primaryColumns);

    if (tableColumns) {
      const existingColumnIds = Object.keys(primaryColumns);
      const existingDerivedColumnIds = Object.keys(derivedColumns);

      const newColumnIds = Object.keys(tableColumns);

      //Check if there is any difference in the existing and new columns ids
      if (_.xor(existingColumnIds, newColumnIds).length > 0) {
        const newColumnIdsToAdd = _.without(newColumnIds, ...existingColumnIds);

        const propertiesToAdd: Record<string, unknown> = {};

        newColumnIdsToAdd.forEach((columnId: string) => {
          // id could be an empty string
          if (!!columnId) {
            Object.entries(tableColumns[columnId]).forEach(([key, value]) => {
              propertiesToAdd[`primaryColumns.${columnId}.${key}`] = value;
            });
          }
        });

        /*
         * If new columnOrders have different values from the original columnOrders
         * Only update when there are new Columns(Derived or Primary)
         */
        if (
          !!newColumnIds.length &&
          !!_.xor(newColumnIds, columnOrder).length &&
          !equal(_.sortBy(newColumnIds), _.sortBy(existingDerivedColumnIds))
        ) {
          // Maintain original columnOrder and keep new columns at the end
          let newColumnOrder = _.intersection(columnOrder, newColumnIds);

          newColumnOrder = _.union(newColumnOrder, newColumnIds);

          const compareColumns = (a: string, b: string) => {
            const aSticky = tableColumns[a].sticky || "none";
            const bSticky = tableColumns[b].sticky || "none";

            if (aSticky === bSticky) {
              return 0;
            }

            return SORT_ORDER[aSticky] - SORT_ORDER[bSticky];
          };

          // Sort the column order to retain the position of frozen columns
          newColumnOrder.sort(compareColumns);

          propertiesToAdd["columnOrder"] = newColumnOrder;

          /**
           * As the table data changes in Deployed app, we also update the local storage.
           *
           * this.updateColumnProperties gets executed on mount and on update of the component.
           * On mount we get new tableColumns that may not have any sticky columns.
           * This will lead to loss of sticky column that were frozen by the user.
           * To avoid this and to maintain user's sticky columns we use shouldPersistLocalOrderWhenTableDataChanges below
           * so as to avoid updating the local storage on mount.
           **/
          if (
            this.props.renderMode === RenderModes.PAGE &&
            shouldPersistLocalOrderWhenTableDataChanges
          ) {
            const leftOrder = newColumnOrder.filter(
              (col: string) => tableColumns[col].sticky === StickyType.LEFT,
            );
            const rightOrder = newColumnOrder.filter(
              (col: string) => tableColumns[col].sticky === StickyType.RIGHT,
            );

            this.persistColumnOrder(newColumnOrder, leftOrder, rightOrder);
          }
        }

        const propertiesToUpdate: BatchPropertyUpdatePayload = {
          modify: propertiesToAdd,
        };

        const pathsToDelete: string[] = [];
        const columnsIdsToDelete = without(existingColumnIds, ...newColumnIds);

        if (!!columnsIdsToDelete.length) {
          columnsIdsToDelete.forEach((id: string) => {
            if (!primaryColumns[id].isDerived) {
              pathsToDelete.push(`primaryColumns.${id}`);
            }
          });
          propertiesToUpdate.remove = pathsToDelete;
        }

        super.batchUpdateWidgetProperty(propertiesToUpdate, false);
      }
    }
  };

  //no need to batch meta updates
  hydrateStickyColumns = () => {
    const localTableColumnOrder = getColumnOrderByWidgetIdFromLS(
      this.props.widgetId,
    );
    const leftLen: number = Object.keys(
      pickBy(this.props.primaryColumns, (col) => col.sticky === "left"),
    ).length;

    const leftOrder = [...(this.props.columnOrder || [])].slice(0, leftLen);

    const rightLen: number = Object.keys(
      pickBy(this.props.primaryColumns, (col) => col.sticky !== "right"),
    ).length;

    const rightOrder: string[] = [...(this.props.columnOrder || [])].slice(
      rightLen,
    );

    if (localTableColumnOrder) {
      const {
        columnOrder,
        columnUpdatedAt,
        leftOrder: localLeftOrder,
        rightOrder: localRightOrder,
      } = localTableColumnOrder;

      if (this.props.columnUpdatedAt !== columnUpdatedAt) {
        // Delete and set the column orders defined by the developer
        deleteLocalTableColumnOrderByWidgetId(this.props.widgetId);

        this.persistColumnOrder(
          this.props.columnOrder ?? [],
          leftOrder,
          rightOrder,
        );
      } else {
        const propertiesToAdd: Record<string, string> = {};

        propertiesToAdd["columnOrder"] = columnOrder;

        /**
         * We reset the sticky values of the columns that were frozen by the developer.
         */
        if (Object.keys(this.props.primaryColumns).length > 0) {
          columnOrder.forEach((colName: string) => {
            if (
              this.props.primaryColumns[colName]?.sticky !== StickyType.NONE
            ) {
              propertiesToAdd[`primaryColumns.${colName}.sticky`] =
                StickyType.NONE;
            }
          });
        }

        /**
         * We pickup the left and the right frozen columns from the localstorage
         * and update the sticky value of these columns respectively.
         */

        if (localLeftOrder.length > 0) {
          localLeftOrder.forEach((colName: string) => {
            propertiesToAdd[`primaryColumns.${colName}.sticky`] =
              StickyType.LEFT;
          });
        }

        if (localRightOrder.length > 0) {
          localRightOrder.forEach((colName: string) => {
            propertiesToAdd[`primaryColumns.${colName}.sticky`] =
              StickyType.RIGHT;
          });
        }

        const propertiesToUpdate = {
          modify: propertiesToAdd,
        };

        super.batchUpdateWidgetProperty(propertiesToUpdate);
      }
    } else {
      // If user deletes local storage or no column orders for the given table widget exists hydrate it with the developer changes.
      this.persistColumnOrder(
        this.props.columnOrder ?? [],
        leftOrder,
        rightOrder,
      );
    }
  };

  componentDidMount() {
    const { canFreezeColumn, renderMode, tableData } = this.props;

    if (_.isArray(tableData) && !!tableData.length) {
      const newPrimaryColumns = this.createTablePrimaryColumns();

      // When the Table data schema changes
      if (newPrimaryColumns && !!Object.keys(newPrimaryColumns).length) {
        this.updateColumnProperties(newPrimaryColumns);
      }
    }

    if (canFreezeColumn && renderMode === RenderModes.PAGE) {
      //dont neet to batch this since single action
      this.hydrateStickyColumns();
    }

    // Commit Batch Updates property `true` is passed as commitBatchMetaUpdates is not called on componentDidMount and we need to call it for updating the batch updates
    this.updateInfiniteScrollProperties(true);
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const {
      commitBatchMetaUpdates,
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      infiniteScrollEnabled,
      pageNo,
      pageSize,
      primaryColumns = {},
      pushBatchMetaUpdates,
      serverSidePaginationEnabled,
      totalRecordsCount,
    } = this.props;

    // Bail out if tableData is a string. This signifies an error in evaluations
    if (isString(this.props.tableData)) {
      return;
    }

    if (
      this.props.primaryColumns &&
      (!equal(prevProps.columnOrder, this.props.columnOrder) ||
        filter(prevProps.orderedTableColumns, { isVisible: false }).length !==
          filter(this.props.orderedTableColumns, { isVisible: false }).length ||
        getAllStickyColumnsCount(prevProps.orderedTableColumns) !==
          getAllStickyColumnsCount(this.props.orderedTableColumns))
    ) {
      if (this.props.renderMode === RenderModes.CANVAS) {
        super.batchUpdateWidgetProperty(
          {
            modify: {
              columnUpdatedAt: Date.now(),
            },
          },
          false,
        );
      }
    }

    //check if necessary we are batching now updates
    // Check if tableData is modifed
    const isTableDataModified = this.props.tableData !== prevProps.tableData;

    // If the user has changed the tableData OR
    // The binding has returned a new value
    if (isTableDataModified) {
      this.pushMetaRowDataUpdates(
        prevProps.filteredTableData,
        this.props.filteredTableData,
      );

      pushBatchMetaUpdates("triggeredRowIndex", -1);

      const newColumnIds: string[] = getAllTableColumnKeys(
        this.props.tableData,
      );
      const primaryColumnIds = Object.keys(primaryColumns).filter(
        (id: string) => !primaryColumns[id].isDerived,
      );

      if (xor(newColumnIds, primaryColumnIds).length > 0) {
        const newTableColumns = this.createTablePrimaryColumns();

        if (newTableColumns) {
          this.updateColumnProperties(newTableColumns, isTableDataModified);
        }

        pushBatchMetaUpdates("filters", []);
      }

      /*
       * Clear transient table data and editablecell when tableData changes
       */
      pushBatchMetaUpdates("transientTableData", {});
      // reset updatedRowIndex whenever transientTableData is flushed.
      pushBatchMetaUpdates("updatedRowIndex", -1);

      /*
       * Updating the caching layer on table data modification
       * Commit Batch Updates property `false` is passed as commitBatchMetaUpdates is called on componentDidUpdate
       * and we need not to explicitly call it for updating the batch updates
       * */
      this.updateInfiniteScrollProperties();

      this.pushClearEditableCellsUpdates();
      pushBatchMetaUpdates("selectColumnFilterText", {});
    } else {
      // TODO: reset the widget on any property change, like if the toggle of infinite scroll is enabled and previously it was disabled, currently we update cachedTableData property to the current tableData at pageNo.
      /*
       * Commit Batch Updates property `false` is passed as commitBatchMetaUpdates is called on componentDidUpdate
       * and we need not to explicitly call it for updating the batch updates
       * */
      if (
        !prevProps.infiniteScrollEnabled &&
        this.props.infiniteScrollEnabled
      ) {
        this.updateInfiniteScrollProperties();
      }
    }

    if (!pageNo) {
      pushBatchMetaUpdates("pageNo", 1);
      this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
    }

    //check if pageNo does not excede the max Page no, due to change of totalRecordsCount
    if (serverSidePaginationEnabled !== prevProps.serverSidePaginationEnabled) {
      //reset pageNo when serverSidePaginationEnabled is toggled
      pushBatchMetaUpdates("pageNo", 1);
      this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
    } else {
      //check if pageNo does not excede the max Page no, due to change of totalRecordsCount or change of pageSize
      if (serverSidePaginationEnabled && totalRecordsCount) {
        const maxAllowedPageNumber = Math.ceil(totalRecordsCount / pageSize);

        if (pageNo > maxAllowedPageNumber) {
          pushBatchMetaUpdates("pageNo", maxAllowedPageNumber);
          this.updatePaginationDirectionFlags(PaginationDirection.NEXT_PAGE);
        }
      }
    }

    // Reset widget state when infinite scroll is initially enabled
    // This should come after all updateInfiniteScrollProperties are done
    if (!prevProps.infiniteScrollEnabled && infiniteScrollEnabled) {
      this.resetTableForInfiniteScroll();
    }

    /*
     * When defaultSelectedRowIndex or defaultSelectedRowIndices
     * is changed from property pane
     */
    if (
      !equal(defaultSelectedRowIndex, prevProps.defaultSelectedRowIndex) ||
      !equal(defaultSelectedRowIndices, prevProps.defaultSelectedRowIndices)
    ) {
      this.pushUpdateSelectedRowIndexUpdates();
    }

    this.pushResetPageNoUpdates(prevProps);

    this.pushResetRowSelectionPropertiesUpdates(prevProps);
    commitBatchMetaUpdates();
  }

  pushResetPageNoUpdates = (prevProps: TableWidgetProps) => {
    const { onPageSizeChange, pageSize, pushBatchMetaUpdates } = this.props;

    if (pageSize !== prevProps.pageSize) {
      if (onPageSizeChange) {
        this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
        pushBatchMetaUpdates("pageNo", 1, {
          triggerPropertyName: "onPageSizeChange",
          dynamicString: onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      } else {
        pushBatchMetaUpdates("pageNo", 1);
        this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
      }
    }
  };

  pushResetRowSelectionPropertiesUpdates = (prevProps: TableWidgetProps) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
      pushBatchMetaUpdates,
    } = this.props;

    // reset selectedRowIndices and selectedRowIndex to defaults
    if (multiRowSelection !== prevProps.multiRowSelection) {
      if (multiRowSelection) {
        if (
          defaultSelectedRowIndices &&
          _.isArray(defaultSelectedRowIndices) &&
          defaultSelectedRowIndices.every((i) => _.isFinite(i))
        ) {
          pushBatchMetaUpdates("selectedRowIndices", defaultSelectedRowIndices);
        }

        pushBatchMetaUpdates("selectedRowIndex", -1);
      } else {
        if (
          !isNil(defaultSelectedRowIndex) &&
          parseInt(defaultSelectedRowIndex?.toString(), 10) > -1
        ) {
          pushBatchMetaUpdates("selectedRowIndex", defaultSelectedRowIndex);
        }

        pushBatchMetaUpdates("selectedRowIndices", []);
      }
    }
  };

  /*
   * Function to update selectedRowIndices & selectedRowIndex from
   * defaultSelectedRowIndices & defaultSelectedRowIndex respectively
   */
  pushUpdateSelectedRowIndexUpdates = () => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
      pushBatchMetaUpdates,
    } = this.props;

    if (multiRowSelection) {
      pushBatchMetaUpdates("selectedRowIndices", defaultSelectedRowIndices);
    } else {
      pushBatchMetaUpdates("selectedRowIndex", defaultSelectedRowIndex);
    }
  };

  /*
   * Function to update selectedRow details when order of tableData changes
   */
  pushMetaRowDataUpdates = (
    oldTableData: Array<Record<string, unknown>>,
    newTableData: Array<Record<string, unknown>>,
  ) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
      primaryColumnId,
      pushBatchMetaUpdates,
      selectedRowIndex,
      selectedRowIndices,
    } = this.props;

    if (multiRowSelection) {
      const indices = getSelectRowIndices(
        oldTableData,
        newTableData,
        defaultSelectedRowIndices,
        selectedRowIndices,
        primaryColumnId,
      );

      pushBatchMetaUpdates("selectedRowIndices", indices);
    } else {
      const index = getSelectRowIndex(
        oldTableData,
        newTableData,
        defaultSelectedRowIndex,
        selectedRowIndex,
        primaryColumnId,
      );

      pushBatchMetaUpdates("selectedRowIndex", index);
    }
  };

  getSelectedRowIndices = () => {
    const { multiRowSelection, selectedRowIndices } = this.props;

    let indices: number[] | undefined;

    if (multiRowSelection) {
      if (_.isArray(selectedRowIndices)) {
        indices = selectedRowIndices;
      } else if (_.isNumber(selectedRowIndices)) {
        indices = [selectedRowIndices];
      } else {
        indices = [];
      }
    } else {
      indices = undefined;
    }

    return indices;
  };

  updateFilters = (filters: ReactTableFilter[]) => {
    const {
      commitBatchMetaUpdates,
      enableServerSideFiltering,
      onTableFilterUpdate,
      pushBatchMetaUpdates,
    } = this.props;

    this.pushResetSelectedRowIndexUpdates();

    if (enableServerSideFiltering) {
      pushBatchMetaUpdates("filters", filters, {
        triggerPropertyName: "onTableFilterUpdate",
        dynamicString: onTableFilterUpdate,
        event: {
          type: EventType.ON_FILTER_UPDATE,
        },
      });
    } else {
      pushBatchMetaUpdates("filters", filters);
    }

    // Reset Page only when a filter is added
    if (!isEmpty(xorWith(filters, [DEFAULT_FILTER], equal))) {
      pushBatchMetaUpdates("pageNo", 1);
      this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
    }

    commitBatchMetaUpdates();
  };

  toggleDrag = (disable: boolean) => {
    this.disableDrag(disable);
  };

  getPaddingAdjustedDimensions = () => {
    // eslint-disable-next-line prefer-const
    let { componentHeight, componentWidth } = this.props;

    // (2 * WIDGET_PADDING) gives the total horizontal padding (i.e. paddingLeft + paddingRight)
    componentWidth = componentWidth - 2 * WIDGET_PADDING;

    return { componentHeight, componentWidth };
  };

  getWidgetView() {
    const {
      customIsLoading,
      customIsLoadingValue,
      customSortFunction: customSortFunctionData,
      delimiter,
      filteredTableData = [],
      isVisibleDownload,
      isVisibleFilters,
      isVisiblePagination,
      isVisibleSearch,
      pageSize,
      primaryColumns,
      totalRecordsCount,
    } = this.props;

    const tableColumns = this.getTableColumns() || emptyArr;
    let data = filteredTableData;

    if (customSortFunctionData && Array.isArray(customSortFunctionData)) {
      data = customSortFunctionData;
    }

    const transformedData = this.transformData(data, tableColumns);

    const isVisibleHeaderOptions =
      isVisibleDownload ||
      isVisibleFilters ||
      isVisiblePagination ||
      isVisibleSearch;

    const { componentHeight, componentWidth } =
      this.getPaddingAdjustedDimensions();
    const finalTableData = this.memoisedAddNewRow(
      transformedData,
      this.props.isAddRowInProgress,
      this.props.newRowContent,
    );

    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          accentColor={this.props.accentColor}
          allowAddNewRow={this.props.allowAddNewRow}
          allowRowSelection={!this.props.isAddRowInProgress}
          allowSorting={!this.props.isAddRowInProgress}
          applyFilter={this.updateFilters}
          borderColor={this.props.borderColor}
          borderRadius={this.props.borderRadius}
          borderWidth={this.props.borderWidth}
          boxShadow={this.props.boxShadow}
          canFreezeColumn={this.props.canFreezeColumn}
          columnWidthMap={this.props.columnWidthMap}
          columns={tableColumns}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          delimiter={delimiter}
          disableDrag={this.toggleDrag}
          disabledAddNewRowSave={this.hasInvalidColumnCell()}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          editableCell={this.props.editableCell}
          endOfData={this.props.endOfData}
          filters={this.props.filters}
          handleColumnFreeze={this.handleColumnFreeze}
          handleReorderColumn={this.handleReorderColumn}
          handleResizeColumn={this.handleResizeColumn}
          height={componentHeight}
          isAddRowInProgress={this.props.isAddRowInProgress}
          isEditableCellsValid={this.props.isEditableCellsValid}
          isInfiniteScrollEnabled={this.props.infiniteScrollEnabled}
          isLoading={
            customIsLoading
              ? customIsLoadingValue || this.props.isLoading
              : this.props.isLoading
          }
          isSortable={this.props.isSortable ?? true}
          isVisibleDownload={isVisibleDownload}
          isVisibleFilters={isVisibleFilters}
          isVisiblePagination={isVisiblePagination}
          isVisibleSearch={isVisibleSearch}
          multiRowSelection={
            this.props.multiRowSelection && !this.props.isAddRowInProgress
          }
          nextPageClick={this.handleNextPageClick}
          onAddNewRow={this.handleAddNewRowClick}
          onAddNewRowAction={this.handleAddNewRowAction}
          onBulkEditDiscard={this.onBulkEditDiscard}
          onBulkEditSave={this.onBulkEditSave}
          onConnectData={this.onConnectData}
          onRowClick={this.handleRowClick}
          pageNo={this.props.pageNo}
          pageSize={
            isVisibleHeaderOptions ? Math.max(1, pageSize) : pageSize + 1
          }
          prevPageClick={this.handlePrevPageClick}
          primaryColumnId={this.props.primaryColumnId}
          searchKey={this.props.searchText}
          searchTableData={this.handleSearchTable}
          selectAllRow={this.handleAllRowSelect}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          selectedRowIndices={this.getSelectedRowIndices()}
          serverSidePaginationEnabled={!!this.props.serverSidePaginationEnabled}
          showConnectDataOverlay={
            primaryColumns &&
            !Object.keys(primaryColumns).length &&
            this.props.renderMode === RenderModes.CANVAS
          }
          sortTableColumn={this.handleColumnSorting}
          tableData={finalTableData}
          totalRecordsCount={totalRecordsCount}
          triggerRowSelection={this.props.triggerRowSelection}
          unSelectAllRow={this.unSelectAllRow}
          updatePageNo={this.updatePageNumber}
          variant={this.props.variant}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          width={componentWidth}
        />
      </Suspense>
    );
  }

  /**
   * Function to update or add the tableWidgetColumnOrder key in the local storage
   * tableWidgetColumnOrder = {
   *  <widget-id>: {
   *    columnOrder: [],
   *    leftOrder: [],
   *    rightOrder: [],
   *  }
   * }
   */
  persistColumnOrder = (
    newColumnOrder: string[],
    leftOrder: string[],
    rightOrder: string[],
  ) => {
    const widgetId = this.props.widgetId;
    const localTableWidgetColumnOrder = localStorage.getItem(
      TABLE_COLUMN_ORDER_KEY,
    );
    let newTableColumnOrder;

    if (localTableWidgetColumnOrder) {
      try {
        let parsedTableWidgetColumnOrder = JSON.parse(
          localTableWidgetColumnOrder,
        );

        let columnOrder;

        if (newColumnOrder) {
          columnOrder = newColumnOrder;
        } else if (parsedTableWidgetColumnOrder[widgetId]) {
          columnOrder = parsedTableWidgetColumnOrder[widgetId];
        } else {
          columnOrder = this.props.columnOrder;
        }

        parsedTableWidgetColumnOrder = {
          ...parsedTableWidgetColumnOrder,
          [widgetId]: {
            columnOrder,
            columnUpdatedAt: this.props.columnUpdatedAt,
            leftOrder,
            rightOrder,
          },
        };

        newTableColumnOrder = parsedTableWidgetColumnOrder;
      } catch (e) {
        log.debug("Unable to parse local column order:", { e });
      }
    } else {
      const tableWidgetColumnOrder = {
        [widgetId]: {
          columnOrder: newColumnOrder,
          columnUpdatedAt: this.props.columnUpdatedAt,
          leftOrder,
          rightOrder,
        },
      };

      newTableColumnOrder = tableWidgetColumnOrder;
    }

    localStorage.setItem(
      TABLE_COLUMN_ORDER_KEY,
      JSON.stringify(newTableColumnOrder),
    );
  };

  handleColumnFreeze = (columnName: string, sticky?: StickyType) => {
    if (this.props.columnOrder) {
      let newColumnOrder;
      const localTableColumnOrder = getColumnOrderByWidgetIdFromLS(
        this.props.widgetId,
      );

      if (this.props.renderMode === RenderModes.CANVAS) {
        newColumnOrder = generateNewColumnOrderFromStickyValue(
          this.props.primaryColumns,
          this.props.columnOrder,
          columnName,
          sticky,
        );

        // Updating these properties in batch so that undo/redo gets executed in a combined way.
        super.batchUpdateWidgetProperty(
          {
            modify: {
              [`primaryColumns.${columnName}.sticky`]: sticky,
              columnOrder: newColumnOrder,
            },
          },
          true,
        );
      } else if (
        localTableColumnOrder &&
        this.props.renderMode === RenderModes.PAGE
      ) {
        const { leftOrder, rightOrder } = localTableColumnOrder;

        newColumnOrder = generateLocalNewColumnOrderFromStickyValue(
          localTableColumnOrder.columnOrder,
          columnName,
          sticky,
          leftOrder,
          rightOrder,
        );
        const updatedOrders = updateAndSyncTableLocalColumnOrders(
          columnName,
          leftOrder,
          rightOrder,
          sticky,
        );

        this.persistColumnOrder(
          newColumnOrder,
          updatedOrders.leftOrder,
          updatedOrders.rightOrder,
        );

        super.batchUpdateWidgetProperty(
          {
            modify: {
              [`primaryColumns.${columnName}.sticky`]: sticky,
              columnOrder: newColumnOrder,
            },
          },
          true,
        );
      }
    }
  };

  handleReorderColumn = (columnOrder: string[]) => {
    columnOrder = columnOrder.map((alias) => this.getColumnIdByAlias(alias));

    if (
      this.props.canFreezeColumn &&
      this.props.renderMode === RenderModes.PAGE
    ) {
      const localTableColumnOrder = getColumnOrderByWidgetIdFromLS(
        this.props.widgetId,
      );

      if (localTableColumnOrder) {
        const { leftOrder, rightOrder } = localTableColumnOrder;

        this.persistColumnOrder(columnOrder, leftOrder, rightOrder);
      } else {
        this.persistColumnOrder(columnOrder, [], []);
      }
    }

    super.updateWidgetProperty("columnOrder", columnOrder);
  };

  handleColumnSorting = (columnAccessor: string, isAsc: boolean) => {
    const columnId = this.getColumnIdByAlias(columnAccessor);
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    this.pushResetSelectedRowIndexUpdates(false);

    let sortOrderProps;

    if (columnId) {
      sortOrderProps = {
        column: columnId,
        order: isAsc ? SortOrderTypes.asc : SortOrderTypes.desc,
      };
    } else {
      sortOrderProps = {
        column: "",
        order: null,
      };
    }

    pushBatchMetaUpdates("sortOrder", sortOrderProps, {
      triggerPropertyName: "onSort",
      dynamicString: this.props.onSort,
      event: {
        type: EventType.ON_SORT,
      },
    });
    commitBatchMetaUpdates();
  };

  handleResizeColumn = (columnWidthMap: { [key: string]: number }) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnWidthMap", columnWidthMap);
    } else {
      //single action no need to batch
      this.props.updateWidgetMetaProperty("columnWidthMap", columnWidthMap);
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSearchTable = (searchKey: any) => {
    const {
      commitBatchMetaUpdates,
      multiRowSelection,
      onSearchTextChanged,
      pushBatchMetaUpdates,
    } = this.props;

    /*
     * Clear rowSelection to avoid selecting filtered rows
     * based on stale selection indices
     */
    if (multiRowSelection) {
      pushBatchMetaUpdates("selectedRowIndices", []);
    } else {
      pushBatchMetaUpdates("selectedRowIndex", -1);
    }

    pushBatchMetaUpdates("pageNo", 1);
    this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);

    pushBatchMetaUpdates("searchText", searchKey, {
      triggerPropertyName: "onSearchTextChanged",
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });

    commitBatchMetaUpdates();
  };

  /**
   * This function just pushes the meta update
   */
  pushOnColumnEvent = ({
    action,
    additionalData = {},
    eventType,
    onComplete = noop,
    row,
    rowIndex,
    triggerPropertyName,
  }: OnColumnEventArgs) => {
    const { filteredTableData = [], pushBatchMetaUpdates } = this.props;

    const currentRow = row || filteredTableData[rowIndex];

    pushBatchMetaUpdates(
      "triggeredRowIndex",
      currentRow?.[ORIGINAL_INDEX_KEY],
      {
        triggerPropertyName: triggerPropertyName,
        dynamicString: action,
        event: {
          type: eventType,
          callback: onComplete,
        },
        globalContext: { currentRow, ...additionalData },
      },
    );
  };
  /*
   * Function to handle customColumn button type click interactions
   */
  onColumnEvent = ({
    action,
    additionalData = {},
    eventType,
    onComplete = noop,
    row,
    rowIndex,
    triggerPropertyName,
  }: OnColumnEventArgs) => {
    if (action) {
      const { commitBatchMetaUpdates } = this.props;

      this.pushOnColumnEvent({
        rowIndex,
        action,
        onComplete,
        triggerPropertyName,
        eventType,
        row,
        additionalData,
      });
      commitBatchMetaUpdates();
    } else {
      onComplete();
    }
  };

  onDropdownOptionSelect = (action: string) => {
    super.executeAction({
      dynamicString: action,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  handleAllRowSelect = (pageData: Record<string, unknown>[]) => {
    if (this.props.multiRowSelection) {
      const selectedRowIndices = pageData.map(
        (row: Record<string, unknown>) => row.index,
      );

      //single action no need to batch
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
    }
  };

  handleRowClick = (row: Record<string, unknown>, selectedIndex: number) => {
    const { multiRowSelection, selectedRowIndex, selectedRowIndices } =
      this.props;
    // no need to batch actions here because it a time only one will execute

    if (multiRowSelection) {
      let indices: Array<number>;

      if (_.isArray(selectedRowIndices)) {
        indices = [...selectedRowIndices];
      } else {
        indices = [];
      }

      /*
       * Deselect if the index is already present
       */
      if (indices.includes(selectedIndex)) {
        indices.splice(indices.indexOf(selectedIndex), 1);
        this.props.updateWidgetMetaProperty("selectedRowIndices", indices);
      } else {
        /*
         * select if the index is not present already
         */
        indices.push(selectedIndex);

        this.props.updateWidgetMetaProperty("selectedRowIndices", indices, {
          triggerPropertyName: "onRowSelected",
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        });
      }
    } else {
      let index;

      if (isNumber(selectedRowIndex)) {
        index = selectedRowIndex;
      } else {
        index = -1;
      }

      if (index !== selectedIndex) {
        this.props.updateWidgetMetaProperty("selectedRowIndex", selectedIndex, {
          triggerPropertyName: "onRowSelected",
          dynamicString: this.props.onRowSelected,
          event: {
            type: EventType.ON_ROW_SELECTED,
          },
        });
      } else {
        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
      }
    }
  };

  updatePageNumber = (pageNo: number, event?: EventType) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    const paginationDirection =
      event == EventType.ON_NEXT_PAGE
        ? PaginationDirection.NEXT_PAGE
        : PaginationDirection.PREVIOUS_PAGE;

    this.updatePaginationDirectionFlags(paginationDirection);

    if (event) {
      pushBatchMetaUpdates("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
        dynamicString: this.props.onPageChange,
        event: {
          type: event,
        },
      });
    } else {
      pushBatchMetaUpdates("pageNo", pageNo);
    }

    if (this.props.onPageChange) {
      this.pushResetSelectedRowIndexUpdates();
    }

    commitBatchMetaUpdates();
  };

  updatePaginationDirectionFlags = (direction?: PaginationDirection) => {
    const { pushBatchMetaUpdates } = this.props;

    let previousButtonFlag = false;
    let nextButtonFlag = false;

    if (direction) {
      switch (direction) {
        case PaginationDirection.INITIAL: {
          previousButtonFlag = false;
          nextButtonFlag = false;
          break;
        }
        case PaginationDirection.NEXT_PAGE: {
          nextButtonFlag = true;
          break;
        }
        case PaginationDirection.PREVIOUS_PAGE: {
          previousButtonFlag = true;
          break;
        }
      }
    }

    pushBatchMetaUpdates("previousPageVisited", previousButtonFlag);
    pushBatchMetaUpdates("nextPageVisited", nextButtonFlag);
  };

  handleNextPageClick = () => {
    const pageNo = (this.props.pageNo || 1) + 1;
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    this.updatePaginationDirectionFlags(PaginationDirection.NEXT_PAGE);

    pushBatchMetaUpdates("pageNo", pageNo, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_NEXT_PAGE,
      },
    });

    if (this.props.onPageChange) {
      this.pushResetSelectedRowIndexUpdates();
    }

    commitBatchMetaUpdates();
  };

  pushResetSelectedRowIndexUpdates = (skipDefault?: boolean) => {
    const { pushBatchMetaUpdates } = this.props;

    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    if (multiRowSelection) {
      pushBatchMetaUpdates(
        "selectedRowIndices",
        skipDefault ? [] : defaultSelectedRowIndices,
      );
    } else {
      pushBatchMetaUpdates(
        "selectedRowIndex",
        skipDefault ? -1 : defaultSelectedRowIndex,
      );
    }
  };

  unSelectAllRow = () => {
    this.props.updateWidgetMetaProperty("selectedRowIndices", []);
  };

  handlePrevPageClick = () => {
    const pageNo = (this.props.pageNo || 1) - 1;
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (pageNo >= 1) {
      this.updatePaginationDirectionFlags(PaginationDirection.PREVIOUS_PAGE);
      pushBatchMetaUpdates("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
        dynamicString: this.props.onPageChange,
        event: {
          type: EventType.ON_PREV_PAGE,
        },
      });

      if (this.props.onPageChange) {
        this.pushResetSelectedRowIndexUpdates();
      }
    }

    commitBatchMetaUpdates();
  };

  getColumnIdByAlias(alias: string) {
    const { primaryColumns } = this.props;

    if (primaryColumns) {
      const column = Object.values(primaryColumns).find(
        (column) => column.alias === alias,
      );

      if (column) {
        return column.id;
      }
    }

    return alias;
  }

  getColumnByOriginalId(originalId: string) {
    return Object.values(this.props.primaryColumns).find((column) => {
      return column.originalId === originalId;
    });
  }

  pushTransientTableDataActionsUpdates = (data: TransientDataPayload) => {
    const { __originalIndex__, ...transientData } = data;
    const { pushBatchMetaUpdates } = this.props;

    pushBatchMetaUpdates("transientTableData", {
      ...this.props.transientTableData,
      [__originalIndex__]: {
        ...this.props.transientTableData[__originalIndex__],
        ...transientData,
      },
    });

    pushBatchMetaUpdates("updatedRowIndex", __originalIndex__);
  };

  removeRowFromTransientTableData = (index: number) => {
    const newTransientTableData = klonaRegularWithTelemetry(
      this.props.transientTableData,
      "TableWidgetV2.removeRowFromTransientTableData",
    );
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (newTransientTableData) {
      delete newTransientTableData[index];

      pushBatchMetaUpdates("transientTableData", newTransientTableData);
    }

    pushBatchMetaUpdates("updatedRowIndex", -1);
    commitBatchMetaUpdates();
  };

  getRowOriginalIndex = (index: number) => {
    const { filteredTableData } = this.props;

    if (filteredTableData) {
      const row = filteredTableData[index];

      if (row) {
        return row[ORIGINAL_INDEX_KEY];
      }
    }

    return -1;
  };

  onBulkEditSave = () => {
    this.props.updateWidgetMetaProperty(
      "transientTableData",
      this.props.transientTableData,
      {
        triggerPropertyName: "onBulkSave",
        dynamicString: this.props.onBulkSave,
        event: {
          type: EventType.ON_BULK_SAVE,
        },
      },
    );
  };

  onBulkEditDiscard = () => {
    this.props.updateWidgetMetaProperty(
      "transientTableData",
      {},
      {
        triggerPropertyName: "onBulkDiscard",
        dynamicString: this.props.onBulkDiscard,
        event: {
          type: EventType.ON_BULK_DISCARD,
        },
      },
    );
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (props: any) => {
    const column =
      this.getColumnByOriginalId(
        props.cell.column.columnProperties.originalId,
      ) || props.cell.column.columnProperties;
    const rowIndex = props.cell.row.index;

    /*
     * We don't need to render cells that don't display data (button, iconButton, etc)
     */
    if (
      this.props.isAddRowInProgress &&
      rowIndex === 0 &&
      ActionColumnTypes.includes(column.columnType)
    ) {
      return <CellWrapper />;
    }

    const isHidden = !column.isVisible;
    const {
      compactMode = CompactModeTypes.DEFAULT,
      filteredTableData = [],
      multiRowSelection,
      selectedRowIndex,
      selectedRowIndices,
    } = this.props;
    let row;
    let originalIndex: number;

    /*
     * In add new row flow, a temporary row is injected at the top of the tableData, which doesn't
     * have original row index value. so we are using -1 as the value
     */
    if (this.props.isAddRowInProgress) {
      row = filteredTableData[rowIndex - 1];
      originalIndex =
        rowIndex === 0 ? -1 : row?.[ORIGINAL_INDEX_KEY] ?? rowIndex;
    } else {
      row = filteredTableData[rowIndex];
      originalIndex = row ? row[ORIGINAL_INDEX_KEY] ?? rowIndex : rowIndex;
    }

    const isNewRow = this.props.isAddRowInProgress && rowIndex === 0;

    /*
     * cellProperties order or size does not change when filter/sorting/grouping is applied
     * on the data thus original index is needed to identify the column's cell property.
     */
    const cellProperties = getCellProperties(column, originalIndex, isNewRow);
    let isSelected = false;

    if (this.props.transientTableData) {
      cellProperties.hasUnsavedChanges =
        this.props.transientTableData.hasOwnProperty(originalIndex) &&
        this.props.transientTableData[originalIndex].hasOwnProperty(
          props.cell.column.columnProperties.alias,
        );
    }

    if (multiRowSelection) {
      isSelected =
        _.isArray(selectedRowIndices) && selectedRowIndices.includes(rowIndex);
    } else {
      isSelected = selectedRowIndex === rowIndex;
    }

    const isColumnEditable =
      column.isEditable && isColumnTypeEditable(column.columnType);
    const alias = props.cell.column.columnProperties.alias;

    const isCellEditable = isColumnEditable && cellProperties.isCellEditable;

    const isCellEditMode =
      (props.cell.column.alias === this.props.editableCell?.column &&
        rowIndex === this.props.editableCell?.index) ||
      (isNewRow && isColumnEditable);

    const shouldDisableEdit =
      (this.props.inlineEditingSaveOption ===
        InlineEditingSaveOptions.ROW_LEVEL &&
        this.props.updatedRowIndices.length &&
        this.props.updatedRowIndices.indexOf(originalIndex) === -1) ||
      (this.hasInvalidColumnCell() && !isNewRow);

    const disabledEditMessage = `Save or discard the ${
      this.props.isAddRowInProgress ? "newly added" : "unsaved"
    } row to start editing here`;

    if (this.props.isAddRowInProgress) {
      cellProperties.isCellDisabled = rowIndex !== 0;

      if (rowIndex === 0) {
        cellProperties.cellBackground = "";
      }
    }

    switch (column.columnType) {
      case ColumnTypes.BUTTON:
        return (
          <ButtonCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            columnActions={[
              {
                backgroundColor:
                  cellProperties.buttonColor || this.props.accentColor,
                eventType: EventType.ON_CLICK,
                id: column.id,
                isVisible: true,
                label: cellProperties.buttonLabel || DEFAULT_BUTTON_LABEL,
                dynamicTrigger: column.onClick || "",
                variant: cellProperties.buttonVariant,
                borderRadius:
                  cellProperties.borderRadius || this.props.borderRadius,
                boxShadow: cellProperties.boxShadow,
              },
            ]}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isDisabled={!!cellProperties.isDisabled}
            isHidden={isHidden}
            isSelected={isSelected}
            onCommandClick={(action: string, onComplete: () => void) =>
              this.onColumnEvent({
                rowIndex,
                action,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
              })
            }
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.EDIT_ACTIONS:
        return (
          <EditActionCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            columnActions={[
              {
                id: EditableCellActions.SAVE,
                label: cellProperties.saveActionLabel,
                dynamicTrigger: column.onSave || "",
                eventType: EventType.ON_ROW_SAVE,
                iconName: cellProperties.saveActionIconName,
                variant: cellProperties.saveButtonVariant,
                backgroundColor:
                  cellProperties.saveButtonColor || this.props.accentColor,
                iconAlign: cellProperties.saveIconAlign,
                borderRadius:
                  cellProperties.saveBorderRadius || this.props.borderRadius,
                isVisible: cellProperties.isSaveVisible,
                isDisabled:
                  cellProperties.isSaveDisabled || this.hasInvalidColumnCell(),
                boxShadow: cellProperties.boxShadow,
              },
              {
                id: EditableCellActions.DISCARD,
                label: cellProperties.discardActionLabel,
                dynamicTrigger: column.onDiscard || "",
                eventType: EventType.ON_ROW_DISCARD,
                iconName: cellProperties.discardActionIconName,
                variant: cellProperties.discardButtonVariant,
                backgroundColor:
                  cellProperties.discardButtonColor || this.props.accentColor,
                iconAlign: cellProperties.discardIconAlign,
                borderRadius:
                  cellProperties.discardBorderRadius || this.props.borderRadius,
                isVisible: cellProperties.isDiscardVisible,
                isDisabled:
                  cellProperties.isDiscardDisabled ||
                  this.hasInvalidColumnCell(),
                boxShadow: cellProperties.boxShadow,
              },
            ]}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible}
            isHidden={isHidden}
            isSelected={isSelected}
            onCommandClick={(
              action: string,
              onComplete: () => void,
              eventType: EventType,
            ) =>
              this.onColumnEvent({
                rowIndex,
                action,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: eventType,
              })
            }
            onDiscard={() =>
              this.removeRowFromTransientTableData(originalIndex)
            }
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.SELECT:
        return (
          <SelectCell
            accentColor={this.props.accentColor}
            alias={props.cell.column.columnProperties.alias}
            allowCellWrapping={cellProperties.allowCellWrapping}
            autoOpen={!this.props.isAddRowInProgress}
            borderRadius={cellProperties.borderRadius}
            cellBackground={cellProperties.cellBackground}
            columnType={column.columnType}
            compactMode={compactMode}
            disabledEditIcon={
              shouldDisableEdit || this.props.isAddRowInProgress
            }
            disabledEditIconMessage={disabledEditMessage}
            filterText={
              this.props.selectColumnFilterText?.[
                this.props.editableCell?.column || column.alias
              ]
            }
            fontStyle={cellProperties.fontStyle}
            hasUnsavedChanges={cellProperties.hasUnsavedChanges}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellEditMode={isCellEditMode}
            isCellEditable={isCellEditable}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isEditable={isColumnEditable}
            isEditableCellValid={this.isColumnCellValid(alias)}
            isFilterable={cellProperties.isFilterable}
            isHidden={isHidden}
            isNewRow={isNewRow}
            key={props.key}
            onFilterChange={this.onSelectFilterChange}
            onFilterChangeActionString={column.onFilterUpdate}
            onItemSelect={this.onOptionSelect}
            onOptionSelectActionString={column.onOptionChange}
            options={cellProperties.selectOptions}
            placeholderText={cellProperties.placeholderText}
            resetFilterTextOnClose={cellProperties.resetFilterTextOnClose}
            rowIndex={rowIndex}
            serverSideFiltering={cellProperties.serverSideFiltering}
            tableWidth={this.props.componentWidth}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            toggleCellEditMode={this.toggleCellEditMode}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
            width={
              this.props.columnWidthMap?.[column.id] || DEFAULT_COLUMN_WIDTH
            }
          />
        );

      case ColumnTypes.IMAGE:
        const onClick = column.onClick
          ? () =>
              this.onColumnEvent({
                rowIndex,
                action: column.onClick,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
              })
          : noop;

        return (
          <ImageCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            imageSize={cellProperties.imageSize}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            isSelected={isSelected}
            onClick={onClick}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.MENU_BUTTON:
        const getVisibleItems = (rowIndex: number) => {
          const { configureMenuItems, menuItems, menuItemsSource, sourceData } =
            cellProperties;

          if (menuItemsSource === MenuItemsSource.STATIC && menuItems) {
            const visibleItems = Object.values(menuItems)?.filter((item) =>
              getBooleanPropertyValue(item.isVisible, rowIndex),
            );

            return visibleItems?.length
              ? orderBy(visibleItems, ["index"], ["asc"])
              : [];
          } else if (
            menuItemsSource === MenuItemsSource.DYNAMIC &&
            isArray(sourceData) &&
            sourceData?.length &&
            configureMenuItems?.config
          ) {
            const { config } = configureMenuItems;

            const getValue = (
              propertyName: keyof MenuItem,
              index: number,
              rowIndex: number,
            ) => {
              const value = config[propertyName];

              if (isArray(value) && isArray(value[rowIndex])) {
                return value[rowIndex][index];
              } else if (isArray(value)) {
                return value[index];
              }

              return value ?? null;
            };

            const visibleItems = sourceData
              .map((item, index) => ({
                ...item,
                id: index.toString(),
                isVisible: getValue("isVisible", index, rowIndex),
                isDisabled: getValue("isDisabled", index, rowIndex),
                index: index,
                widgetId: "",
                label: getValue("label", index, rowIndex),
                onClick: config?.onClick,
                textColor: getValue("textColor", index, rowIndex),
                backgroundColor: getValue("backgroundColor", index, rowIndex),
                iconAlign: getValue("iconAlign", index, rowIndex),
                iconColor: getValue("iconColor", index, rowIndex),
                iconName: getValue("iconName", index, rowIndex),
              }))
              .filter((item) => item.isVisible === true);

            return visibleItems;
          }

          return [];
        };

        return (
          <MenuButtonCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            borderRadius={
              cellProperties.borderRadius || this.props.borderRadius
            }
            boxShadow={cellProperties.boxShadow}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            configureMenuItems={cellProperties.configureMenuItems}
            fontStyle={cellProperties.fontStyle}
            getVisibleItems={getVisibleItems}
            horizontalAlignment={cellProperties.horizontalAlignment}
            iconAlign={cellProperties.iconAlign}
            iconName={cellProperties.menuButtoniconName || undefined}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isCompact={!!cellProperties.isCompact}
            isDisabled={!!cellProperties.isDisabled}
            isHidden={isHidden}
            isSelected={isSelected}
            label={cellProperties.menuButtonLabel ?? DEFAULT_MENU_BUTTON_LABEL}
            menuColor={
              cellProperties.menuColor || this.props.accentColor || Colors.GREEN
            }
            menuItems={cellProperties.menuItems}
            menuItemsSource={cellProperties.menuItemsSource}
            menuVariant={cellProperties.menuVariant ?? DEFAULT_MENU_VARIANT}
            onCommandClick={(
              action: string,
              index?: number,
              onComplete?: () => void,
            ) => {
              const additionalData: Record<
                string,
                string | number | Record<string, unknown>
              > = {};

              if (cellProperties?.sourceData && _.isNumber(index)) {
                additionalData.currentItem = cellProperties.sourceData[index];
                additionalData.currentIndex = index;
              }

              return this.onColumnEvent({
                rowIndex,
                action,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
                additionalData,
              });
            }}
            rowIndex={originalIndex}
            sourceData={cellProperties.sourceData}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.ICON_BUTTON:
        return (
          <IconButtonCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            borderRadius={
              cellProperties.borderRadius || this.props.borderRadius
            }
            boxShadow={cellProperties.boxShadow || "NONE"}
            buttonColor={
              cellProperties.buttonColor ||
              this.props.accentColor ||
              Colors.GREEN
            }
            buttonVariant={cellProperties.buttonVariant || "PRIMARY"}
            cellBackground={cellProperties.cellBackground}
            columnActions={[
              {
                id: column.id,
                dynamicTrigger: column.onClick || "",
              },
            ]}
            compactMode={compactMode}
            disabled={!!cellProperties.isDisabled}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            iconName={(cellProperties.iconName || IconNames.ADD) as IconName}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            isSelected={isSelected}
            onCommandClick={(action: string, onComplete: () => void) =>
              this.onColumnEvent({
                rowIndex,
                action,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
              })
            }
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.VIDEO:
        return (
          <VideoCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.CHECKBOX:
        return (
          <CheckboxCell
            accentColor={this.props.accentColor}
            borderRadius={
              cellProperties.borderRadius || this.props.borderRadius
            }
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            disabledCheckbox={
              shouldDisableEdit || (this.props.isAddRowInProgress && !isNewRow)
            }
            disabledCheckboxMessage={disabledEditMessage}
            hasUnSavedChanges={cellProperties.hasUnsavedChanges}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellEditable={isCellEditable}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            onChange={() =>
              this.onCheckChange(
                column,
                props.cell.row.values,
                !props.cell.value,
                alias,
                originalIndex,
                rowIndex,
              )
            }
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.SWITCH:
        return (
          <SwitchCell
            accentColor={this.props.accentColor}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            disabledSwitch={
              shouldDisableEdit || (this.props.isAddRowInProgress && !isNewRow)
            }
            disabledSwitchMessage={disabledEditMessage}
            hasUnSavedChanges={cellProperties.hasUnsavedChanges}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellEditable={isCellEditable}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            onChange={() =>
              this.onCheckChange(
                column,
                props.cell.row.values,
                !props.cell.value,
                alias,
                originalIndex,
                rowIndex,
              )
            }
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      case ColumnTypes.DATE:
        return (
          <DateCell
            accentColor={this.props.accentColor}
            alias={props.cell.column.columnProperties.alias}
            borderRadius={this.props.borderRadius}
            cellBackground={cellProperties.cellBackground}
            closeOnSelection
            columnType={column.columnType}
            compactMode={compactMode}
            disabledEditIcon={
              shouldDisableEdit || this.props.isAddRowInProgress
            }
            disabledEditIconMessage={disabledEditMessage}
            firstDayOfWeek={props.cell.column.columnProperties.firstDayOfWeek}
            fontStyle={cellProperties.fontStyle}
            hasUnsavedChanges={cellProperties.hasUnsavedChanges}
            horizontalAlignment={cellProperties.horizontalAlignment}
            inputFormat={cellProperties.inputFormat}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellEditMode={isCellEditMode}
            isCellEditable={isCellEditable}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isEditableCellValid={this.isColumnCellValid(alias)}
            isHidden={isHidden}
            isNewRow={isNewRow}
            isRequired={
              props.cell.column.columnProperties.validation
                .isColumnEditableCellRequired
            }
            maxDate={props.cell.column.columnProperties.validation.maxDate}
            minDate={props.cell.column.columnProperties.validation.minDate}
            onCellTextChange={this.onCellTextChange}
            onDateSave={this.onDateSave}
            onDateSelectedString={
              props.cell.column.columnProperties.onDateSelected
            }
            outputFormat={cellProperties.outputFormat}
            rowIndex={rowIndex}
            shortcuts={cellProperties.shortcuts}
            tableWidth={this.props.componentWidth}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            timePrecision={cellProperties.timePrecision || TimePrecision.NONE}
            toggleCellEditMode={this.toggleCellEditMode}
            updateNewRowValues={this.updateNewRowValues}
            validationErrorMessage="This field is required"
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
            widgetId={this.props.widgetId}
          />
        );

      case ColumnTypes.HTML:
        return (
          <HTMLCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            renderMode={this.props.renderMode}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      default:
        let validationErrorMessage;

        if (isCellEditMode) {
          validationErrorMessage =
            column.validation.isColumnEditableCellRequired &&
            (isNil(props.cell.value) || props.cell.value === "")
              ? "This field is required"
              : column.validation?.errorMessage;
        }

        return (
          <PlainTextCell
            accentColor={this.props.accentColor}
            alias={props.cell.column.columnProperties.alias}
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            columnType={column.columnType}
            compactMode={compactMode}
            currencyCode={cellProperties.currencyCode}
            decimals={cellProperties.decimals}
            disabledEditIcon={
              shouldDisableEdit || this.props.isAddRowInProgress
            }
            disabledEditIconMessage={disabledEditMessage}
            displayText={cellProperties.displayText}
            fontStyle={cellProperties.fontStyle}
            hasUnsavedChanges={cellProperties.hasUnsavedChanges}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellDisabled={cellProperties.isCellDisabled}
            isCellEditMode={isCellEditMode}
            isCellEditable={isCellEditable}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isEditableCellValid={this.isColumnCellValid(alias)}
            isHidden={isHidden}
            isNewRow={isNewRow}
            notation={cellProperties.notation}
            onCellTextChange={this.onCellTextChange}
            onSubmitString={props.cell.column.columnProperties.onSubmit}
            rowIndex={rowIndex}
            tableWidth={this.props.componentWidth}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            thousandSeparator={cellProperties.thousandSeparator}
            toggleCellEditMode={this.toggleCellEditMode}
            validationErrorMessage={validationErrorMessage}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
            widgetId={this.props.widgetId}
          />
        );
    }
  };

  onCellTextChange = (
    value: EditableCell["value"],
    inputValue: string,
    alias: string,
  ) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (this.props.isAddRowInProgress) {
      this.updateNewRowValues(alias, inputValue, value);
    } else {
      pushBatchMetaUpdates("editableCell", {
        ...this.props.editableCell,
        value: value,
        inputValue,
      });

      if (this.props.editableCell?.column) {
        pushBatchMetaUpdates("columnEditableCellValue", {
          ...this.props.columnEditableCellValue,
          [this.props.editableCell?.column]: value,
        });
      }

      commitBatchMetaUpdates();
    }
  };

  toggleCellEditMode = (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit?: string,
    action?: EditableCellActions,
  ) => {
    if (this.props.isAddRowInProgress) {
      return;
    }

    if (enable) {
      if (this.inlineEditTimer) {
        clearTimeout(this.inlineEditTimer);
      }

      const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

      pushBatchMetaUpdates("editableCell", {
        column: alias,
        index: rowIndex,
        value: value,
        // To revert back to previous on discard
        initialValue: value,
        inputValue: value,
        __originalIndex__: this.getRowOriginalIndex(rowIndex),
      });
      pushBatchMetaUpdates("columnEditableCellValue", {
        ...this.props.columnEditableCellValue,
        [alias]: value,
      });

      /*
       * We need to clear the selectedRowIndex and selectedRowIndices
       * if the rows are sorted, to avoid selectedRow jumping to
       * different page.
       */
      if (this.props.sortOrder.column) {
        if (this.props.multiRowSelection) {
          pushBatchMetaUpdates("selectedRowIndices", []);
        } else {
          pushBatchMetaUpdates("selectedRowIndex", -1);
        }
      }

      commitBatchMetaUpdates();
    } else {
      if (
        this.isColumnCellValid(alias) &&
        action === EditableCellActions.SAVE &&
        value !== this.props.editableCell?.initialValue
      ) {
        const { commitBatchMetaUpdates } = this.props;

        this.pushTransientTableDataActionsUpdates({
          [ORIGINAL_INDEX_KEY]: this.getRowOriginalIndex(rowIndex),
          [alias]: this.props.editableCell?.value,
        });

        if (onSubmit && this.props.editableCell?.column) {
          //since onSubmit is truthy that makes action truthy as well, so we can push this event
          this.pushOnColumnEvent({
            rowIndex: rowIndex,
            action: onSubmit,
            triggerPropertyName: "onSubmit",
            eventType: EventType.ON_SUBMIT,
            row: {
              ...this.props.filteredTableData[rowIndex],
              [this.props.editableCell.column]: this.props.editableCell.value,
            },
          });
        }

        commitBatchMetaUpdates();

        this.clearEditableCell();
      } else if (
        action === EditableCellActions.DISCARD ||
        value === this.props.editableCell?.initialValue
      ) {
        this.clearEditableCell();
      }
    }
  };

  onDateSave = (
    rowIndex: number,
    alias: string,
    value: string,
    onSubmit?: string,
  ) => {
    const { commitBatchMetaUpdates } = this.props;

    this.pushTransientTableDataActionsUpdates({
      [ORIGINAL_INDEX_KEY]: this.getRowOriginalIndex(rowIndex),
      [alias]: value,
    });

    if (onSubmit && this.props.editableCell?.column) {
      //since onSubmit is truthy this makes action truthy as well, so we can push this event
      this.pushOnColumnEvent({
        rowIndex: rowIndex,
        action: onSubmit,
        triggerPropertyName: "onSubmit",
        eventType: EventType.ON_SUBMIT,
        row: {
          ...this.props.filteredTableData[rowIndex],
          [this.props.editableCell.column]: value,
        },
      });
    }

    commitBatchMetaUpdates();
    this.clearEditableCell();
  };
  pushClearEditableCellsUpdates = () => {
    const { pushBatchMetaUpdates } = this.props;

    pushBatchMetaUpdates("editableCell", defaultEditableCell);
    pushBatchMetaUpdates("columnEditableCellValue", {});
  };

  clearEditableCell = (skipTimeout?: boolean) => {
    const clear = () => {
      const { commitBatchMetaUpdates } = this.props;

      this.pushClearEditableCellsUpdates();
      commitBatchMetaUpdates();
    };

    if (skipTimeout) {
      clear();
    } else {
      /*
       * We need to let the evaulations compute derived property (filteredTableData)
       * before we clear the editableCell to avoid the text flickering
       */
      this.inlineEditTimer = setTimeout(clear, 100);
    }
  };

  isColumnCellEditable = (column: ColumnProperties, rowIndex: number) => {
    return (
      column.alias === this.props.editableCell?.column &&
      rowIndex === this.props.editableCell?.index
    );
  };

  onOptionSelect = (
    value: string | number,
    rowIndex: number,
    column: string,
    action?: string,
  ) => {
    if (this.props.isAddRowInProgress) {
      this.updateNewRowValues(column, value, value);
    } else {
      const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

      this.pushTransientTableDataActionsUpdates({
        [ORIGINAL_INDEX_KEY]: this.getRowOriginalIndex(rowIndex),
        [column]: value,
      });
      pushBatchMetaUpdates("editableCell", defaultEditableCell);

      if (action && this.props.editableCell?.column) {
        //since action is truthy we can push this event
        this.pushOnColumnEvent({
          rowIndex,
          action,
          triggerPropertyName: "onOptionChange",
          eventType: EventType.ON_OPTION_CHANGE,
          row: {
            ...this.props.filteredTableData[rowIndex],
            [this.props.editableCell.column]: value,
          },
        });
      }

      commitBatchMetaUpdates();
    }
  };

  onSelectFilterChange = (
    text: string,
    rowIndex: number,
    serverSideFiltering: boolean,
    alias: string,
    action?: string,
  ) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    pushBatchMetaUpdates("selectColumnFilterText", {
      ...this.props.selectColumnFilterText,
      [alias]: text,
    });

    if (action && serverSideFiltering) {
      //since action is truthy we can push this event
      this.pushOnColumnEvent({
        rowIndex,
        action,
        triggerPropertyName: "onFilterUpdate",
        eventType: EventType.ON_FILTER_UPDATE,
        row: {
          ...this.props.filteredTableData[rowIndex],
        },
        additionalData: {
          filterText: text,
        },
      });
    }

    commitBatchMetaUpdates();
  };

  onCheckChange = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: any,
    row: Record<string, unknown>,
    value: boolean,
    alias: string,
    originalIndex: number,
    rowIndex: number,
  ) => {
    if (this.props.isAddRowInProgress) {
      this.updateNewRowValues(alias, value, value);
    } else {
      const { commitBatchMetaUpdates } = this.props;

      this.pushTransientTableDataActionsUpdates({
        [ORIGINAL_INDEX_KEY]: originalIndex,
        [alias]: value,
      });
      commitBatchMetaUpdates();
      //cannot batch this update because we are not sure if it action is truthy or not
      this.onColumnEvent({
        rowIndex,
        action: column.onCheckChange,
        triggerPropertyName: "onCheckChange",
        eventType: EventType.ON_CHECK_CHANGE,
        row: {
          ...row,
          [alias]: value,
        },
      });
    }
  };

  handleAddNewRowClick = () => {
    const defaultNewRow = this.props.defaultNewRow || {};
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    pushBatchMetaUpdates("isAddRowInProgress", true);
    pushBatchMetaUpdates("newRowContent", defaultNewRow);
    pushBatchMetaUpdates("newRow", defaultNewRow);

    // New row gets added at the top of page 1 when client side pagination enabled
    if (!this.props.serverSidePaginationEnabled) {
      this.updatePaginationDirectionFlags(PaginationDirection.INITIAL);
    }

    //Since we're adding a newRowContent thats not part of tableData, the index changes
    // so we're resetting the row selection
    pushBatchMetaUpdates("selectedRowIndex", -1);
    pushBatchMetaUpdates("selectedRowIndices", []);
    commitBatchMetaUpdates();
  };

  handleAddNewRowAction = (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => {
    let triggerPropertyName, action, eventType;

    const onComplete = () => {
      const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

      pushBatchMetaUpdates("isAddRowInProgress", false);
      pushBatchMetaUpdates("newRowContent", undefined);
      pushBatchMetaUpdates("newRow", undefined);
      commitBatchMetaUpdates();

      onActionComplete();
    };

    if (type === AddNewRowActions.SAVE) {
      triggerPropertyName = "onAddNewRowSave";
      action = this.props.onAddNewRowSave;
      eventType = EventType.ON_ADD_NEW_ROW_SAVE;
    } else {
      triggerPropertyName = "onAddNewRowDiscard";
      action = this.props.onAddNewRowDiscard;
      eventType = EventType.ON_ADD_NEW_ROW_DISCARD;
    }

    if (action) {
      super.executeAction({
        triggerPropertyName: triggerPropertyName,
        dynamicString: action,
        event: {
          type: eventType,
          callback: onComplete,
        },
      });
    } else {
      onComplete();
    }
  };

  isColumnCellValid = (columnsAlias: string) => {
    if (this.props.isEditableCellsValid?.hasOwnProperty(columnsAlias)) {
      return this.props.isEditableCellsValid[columnsAlias];
    }

    return true;
  };

  hasInvalidColumnCell = () => {
    if (isObject(this.props.isEditableCellsValid)) {
      return Object.values(this.props.isEditableCellsValid).some((d) => !d);
    } else {
      return false;
    }
  };

  updateNewRowValues = (
    alias: string,
    value: unknown,
    parsedValue: unknown,
  ) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    /*
     * newRowContent holds whatever the user types while newRow holds the parsed value
     * newRowContent is being used to populate the cell while newRow is being used
     * for validations.
     */
    pushBatchMetaUpdates("newRowContent", {
      ...this.props.newRowContent,
      [alias]: value,
    });
    pushBatchMetaUpdates("newRow", {
      ...this.props.newRow,
      [alias]: parsedValue,
    });
    commitBatchMetaUpdates();
  };

  onConnectData = () => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateOneClickBindingOptionsVisibility(true);
    }
  };

  updateInfiniteScrollProperties(shouldCommitBatchUpdates?: boolean) {
    const {
      cachedTableData,
      commitBatchMetaUpdates,
      infiniteScrollEnabled,
      pageNo,
      pageSize,
      processedTableData,
      pushBatchMetaUpdates,
      tableData,
      totalRecordsCount,
    } = this.props;

    if (infiniteScrollEnabled) {
      // Update the cache key for a particular page whenever this function is called. The pageNo data is updated with the tableData.
      const updatedCachedTableData = {
        ...(cachedTableData || {}),
        [pageNo]: tableData,
      };

      pushBatchMetaUpdates("cachedTableData", updatedCachedTableData);

      // The check (!!totalRecordsCount && processedTableData.length === totalRecordsCount) is added if the totalRecordsCount property is set then match the length with the processedTableData which has all flatted data from each page in a single array except the current tableData page i.e. [ ...array of page 1 data, ...array of page 2 data ]. Another 'or' check is if (tableData.length < pageSize) when totalRecordsCount is undefined. Table data has a single page data and if the data comes out to be lesser than the pageSize, it is assumed that the data is finished.
      if (
        (!!totalRecordsCount &&
          processedTableData.length + tableData.length === totalRecordsCount) ||
        (!totalRecordsCount && tableData.length < pageSize)
      ) {
        pushBatchMetaUpdates("endOfData", true);
      } else {
        pushBatchMetaUpdates("endOfData", false);
      }

      if (shouldCommitBatchUpdates) {
        commitBatchMetaUpdates();
      }
    }
  }

  resetTableForInfiniteScroll = () => {
    const { infiniteScrollEnabled, pushBatchMetaUpdates } = this.props;

    if (infiniteScrollEnabled) {
      // reset the cachedRows
      pushBatchMetaUpdates("cachedTableData", {});
      pushBatchMetaUpdates("endOfData", false);

      // reset the meta properties
      const metaProperties = Object.keys(TableWidgetV2.getMetaPropertiesMap());
      metaProperties.forEach((prop) => {
        if (prop !== "pageNo") {
          // Don't reset pageNo yet as we're about to set it
          const defaultValue = TableWidgetV2.getMetaPropertiesMap()[prop];
          this.props.updateWidgetMetaProperty(prop, defaultValue);
        }
      });

      // reset and reload page
      this.updatePageNumber(1, EventType.ON_NEXT_PAGE);
    }
  };
}

export default TableWidgetV2;
