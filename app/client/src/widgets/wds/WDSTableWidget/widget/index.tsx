import log from "loglevel";
import React, { lazy, Suspense } from "react";
import memoizeOne from "memoize-one";

import _, {
  filter,
  isEmpty,
  isNil,
  isNumber,
  isString,
  pickBy,
  union,
  without,
  xor,
  xorWith,
} from "lodash";

import type { WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { FontStyleTypes, RenderModes } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { noop, retryPromise } from "utils/AppsmithUtils";
import type {
  ColumnProperties,
  ReactTableColumnProps,
  ReactTableFilter,
} from "../component/Constants";
import {
  DEFAULT_FILTER,
  SORT_ORDER,
  SortOrderTypes,
  StickyType,
} from "../component/Constants";
import type {
  OnColumnEventArgs,
  TableWidgetProps,
  TransientDataPayload,
} from "../constants";
import {
  ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING,
  defaultEditableCell,
  ORIGINAL_INDEX_KEY,
  PaginationDirection,
  TABLE_COLUMN_ORDER_KEY,
} from "../constants";
import derivedProperties from "./parseDerivedProperties";
import {
  deleteLocalTableColumnOrderByWidgetId,
  generateLocalNewColumnOrderFromStickyValue,
  generateNewColumnOrderFromStickyValue,
  getAllStickyColumnsCount,
  getAllTableColumnKeys,
  getCellProperties,
  getColumnOrderByWidgetIdFromLS,
  getColumnType,
  getDefaultColumnProperties,
  getDerivedColumns,
  getSelectRowIndex,
  getSelectRowIndices,
  updateAndSyncTableLocalColumnOrders,
} from "./utilities";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import equal from "fast-deep-equal/es6";
import { sanitizeKey } from "widgets/WidgetUtils";
import {
  PlainTextCell,
  URLCell,
  ButtonCell,
} from "../component/cellComponents";

import localStorage from "utils/localStorage";
import type { Stylesheet } from "entities/AppTheming";
import type { getColumns } from "./reactTableUtils/getColumnsPureFn";
import { getMemoiseGetColumnsWithLocalStorageFn } from "./reactTableUtils/getColumnsPureFn";
import type {
  tableData,
  transformDataWithEditableCell,
} from "./reactTableUtils/transformDataPureFn";
import { getMemoiseTransformDataWithEditableCell } from "./reactTableUtils/transformDataPureFn";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import * as config from "../config";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { klonaRegularWithTelemetry } from "utils/helpers";

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

export class WDSTableWidget extends BaseWidget<TableWidgetProps, WidgetState> {
  inlineEditTimer: number | null = null;
  memoisedAddNewRow: addNewRowToTable;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  memoiseGetColumnsWithLocalStorage: (localStorage: any) => getColumns;
  memoiseTransformDataWithEditableCell: transformDataWithEditableCell;

  static type = "WDS_TABLE_WIDGET";

  static preloadConfig = true;

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    const defaultsConfig = config.defaultsConfig;

    // Note: Doing this so that unit tests don't fail. Most likely because of cyclic imports
    // This is a temporary fix and should be removed once we have a better solution
    defaultsConfig["enableServerSideFiltering"] = WDSTableWidget.getFeatureFlag(
      ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING,
    )
      ? false
      : undefined;

    return defaultsConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getAnvilConfig() {
    return config.anvilConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return config.styleConfig;
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

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      selectedRow: `{{(()=>{${derivedProperties.getSelectedRow}})()}}`,
      triggeredRow: `{{(()=>{${derivedProperties.getTriggeredRow}})()}}`,
      selectedRows: `{{(()=>{${derivedProperties.getSelectedRows}})()}}`,
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
    return {};
  }

  static getSetterConfig() {
    return config.settersConfig;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  static pasteOperationChecks(
    allWidgets: CanvasWidgetsReduxState,
    oldWidget: FlattenedWidgetProps,
    newWidget: FlattenedWidgetProps,
    widgetIdMap: Record<string, string>,
  ): FlattenedWidgetProps | null {
    if (!newWidget || !newWidget.primaryColumns) return null;

    // If the primaryColumns of the table exist
    const oldWidgetName: string = oldWidget.widgetName;

    if (!oldWidgetName) return null;

    // For each column
    const updatedPrimaryColumns = { ...newWidget.primaryColumns };

    for (const [columnId, column] of Object.entries(updatedPrimaryColumns)) {
      // For each property in the column
      for (const [key, value] of Object.entries(column as ColumnProperties)) {
        // Replace reference of previous widget with the new widgetName
        // This handles binding scenarios like `{{Table2.tableData.map((currentRow) => (currentRow.id))}}`
        updatedPrimaryColumns[columnId][key] = isString(value)
          ? value.replace(
              new RegExp(`\\b${oldWidgetName}\\.`, "g"),
              `${newWidget.widgetName}.`,
            )
          : value;
      }
    }

    return { ...newWidget, primaryColumns: updatedPrimaryColumns };
  }

  /*
   * Function to get the table columns with appropriate render functions
   * based on columnType
   */
  getTableColumns = () => {
    const { columnWidthMap, orderedTableColumns, renderMode, widgetId } =
      this.props;
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

    const existingColumnsKeys = Object.keys(primaryColumns);
    const newTableColumns: Record<string, ColumnProperties> = {};
    const allPosibleColumnsKeys: string[] = getAllTableColumnKeys(tableData);

    /*
     * Generate default column properties for all columns
     * But do not replace existing columns with the same id
     */
    allPosibleColumnsKeys.forEach((columnKey, index) => {
      const existingColumn = this.getColumnByOriginalId(columnKey);

      if (!!existingColumn) {
        // Use the existing column properties
        newTableColumns[existingColumn.id] = existingColumn;
      } else {
        const hashedColumnKey = sanitizeKey(columnKey, {
          existingKeys: union(
            existingColumnsKeys,
            Object.keys(newTableColumns),
          ),
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
    if (_.xor(existingColumnsKeys, newColumnIds).length > 0) {
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
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      pageNo,
      pageSize,
      primaryColumns = {},
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
    const isTableDataModified = !equal(
      this.props.tableData,
      prevProps.tableData,
    );

    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

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
    }

    /*
     * Clear transient table data and editablecell when tableData changes
     */
    if (isTableDataModified) {
      pushBatchMetaUpdates("transientTableData", {});
      // reset updatedRowIndex whenever transientTableData is flushed.
      pushBatchMetaUpdates("updatedRowIndex", -1);

      pushBatchMetaUpdates("selectColumnFilterText", {});
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
    // Hacky fix for now to supply width to table widget
    let componentWidth: number =
      document
        .getElementById(getAnvilWidgetDOMId(this.props.widgetId))
        ?.getBoundingClientRect().width || this.props.componentWidth;

    componentWidth = componentWidth;

    return { componentHeight: 300, componentWidth };
  };

  getWidgetView() {
    const {
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
    const transformedData = this.transformData(filteredTableData, tableColumns);
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
      <Suspense fallback={<>Loading...</>}>
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
          delimiter={delimiter}
          disableDrag={this.toggleDrag}
          disableScroll={
            this.props.renderMode === RenderModes.CANVAS &&
            !Boolean(this.props.isPreviewMode)
          }
          excludeFromTabOrder={this.props.disableWidgetInteraction}
          handleReorderColumn={this.handleReorderColumn}
          handleResizeColumn={this.handleResizeColumn}
          height={componentHeight}
          isAddRowInProgress={this.props.isAddRowInProgress}
          isEditableCellsValid={this.props.isEditableCellsValid}
          isLoading={this.props.isLoading}
          isSortable={this.props.isSortable ?? true}
          isVisibleDownload={isVisibleDownload}
          isVisibleFilters={isVisibleFilters}
          isVisiblePagination={isVisiblePagination}
          isVisibleSearch={isVisibleSearch}
          multiRowSelection={
            this.props.multiRowSelection && !this.props.isAddRowInProgress
          }
          nextPageClick={this.handleNextPageClick}
          onConnectData={this.onConnectData}
          onRowClick={this.handleRowClick}
          onSearch={this.handleSearchTable}
          pageNo={this.props.pageNo}
          pageSize={
            isVisibleHeaderOptions ? Math.max(1, pageSize) : pageSize + 1
          }
          prevPageClick={this.handlePrevPageClick}
          primaryColumnId={this.props.primaryColumnId}
          searchKey={this.props.searchText}
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
            this.props.renderMode === RenderModes.CANVAS &&
            !Boolean(this.props.isPreviewMode)
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
      "WDSTableWidget.removeRowFromTransientTableData",
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (props: any) => {
    const column =
      this.getColumnByOriginalId(
        props.cell.column.columnProperties.originalId,
      ) || props.cell.column.columnProperties;
    const rowIndex = props.cell.row.index;

    const isHidden = !column.isVisible;
    const { filteredTableData = [] } = this.props;
    const row = filteredTableData[rowIndex];
    const originalIndex = row[ORIGINAL_INDEX_KEY] ?? rowIndex;

    /*
     * cellProperties order or size does not change when filter/sorting/grouping is applied
     * on the data thus original index is needed to identify the column's cell property.
     */
    const cellProperties = getCellProperties(column, originalIndex);

    switch (column.columnType) {
      case "url":
        return (
          <URLCell
            href={props.cell.value}
            isBold={cellProperties.fontStyle?.includes(FontStyleTypes.BOLD)}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            isItalic={cellProperties.fontStyle?.includes(FontStyleTypes.ITALIC)}
            text={cellProperties.displayText}
          />
        );
      case "button":
        return (
          <ButtonCell
            buttonColor={cellProperties.buttonColor}
            buttonLabel={cellProperties.buttonLabel || "Action"}
            buttonVariant={cellProperties.buttonVariant}
            excludeFromTabOrder={this.props.disableWidgetInteraction}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isDisabled={cellProperties.isDisabled}
            isHidden={isHidden}
            onClick={(onComplete: () => void) =>
              this.onColumnEvent({
                rowIndex,
                action: column.onClick,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
              })
            }
          />
        );
      default:
        return (
          <PlainTextCell
            cellColor={cellProperties.cellColor}
            fontStyle={cellProperties.fontStyle}
            isBold={cellProperties.fontStyle?.includes(FontStyleTypes.BOLD)}
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            isItalic={cellProperties.fontStyle?.includes(FontStyleTypes.ITALIC)}
            isUnderline={cellProperties.fontStyle?.includes(
              FontStyleTypes.UNDERLINE,
            )}
            value={props.cell.value}
          />
        );
    }
  };

  onConnectData = () => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateOneClickBindingOptionsVisibility(true);
    }
  };
}
