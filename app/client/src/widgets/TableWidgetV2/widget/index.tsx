import React, { lazy, Suspense } from "react";
import log from "loglevel";
import moment, { MomentInput } from "moment";
import _, {
  isNumber,
  isString,
  isNil,
  isEqual,
  xor,
  without,
  isBoolean,
  isArray,
  xorWith,
  isEmpty,
  union,
} from "lodash";

import BaseWidget, { WidgetState } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import Skeleton from "components/utils/Skeleton";
import { noop, retryPromise } from "utils/AppsmithUtils";
import { ReactTableFilter, OperatorTypes } from "../component/Constants";
import {
  ColumnTypes,
  COLUMN_MIN_WIDTH,
  DateInputFormat,
  DEFAULT_BUTTON_LABEL,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MENU_BUTTON_LABEL,
  DEFAULT_MENU_VARIANT,
  EditableCellActions,
  InlineEditingSaveOptions,
  OnColumnEventArgs,
  ORIGINAL_INDEX_KEY,
  TableWidgetProps,
  TransientDataPayload,
} from "../constants";
import derivedProperties from "./parseDerivedProperties";
import {
  getAllTableColumnKeys,
  getDefaultColumnProperties,
  getDerivedColumns,
  getTableStyles,
  getSelectRowIndex,
  getSelectRowIndices,
  getCellProperties,
  isColumnTypeEditable,
} from "./utilities";
import {
  ColumnProperties,
  ReactTableColumnProps,
  CompactModeTypes,
  SortOrderTypes,
} from "../component/Constants";
import tablePropertyPaneConfig from "./propertyConfig";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import { IconName } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";
import { IconNames } from "@blueprintjs/core/node_modules/@blueprintjs/icons";
import equal from "fast-deep-equal/es6";
import { sanitizeKey } from "widgets/WidgetUtils";
import DefaultCell from "../component/cellComponents/DefaultCell";
import { ButtonCell } from "../component/cellComponents/ButtonCell";
import { MenuButtonCell } from "../component/cellComponents/MenuButtonCell";
import { ImageCell } from "../component/cellComponents/ImageCell";
import { VideoCell } from "../component/cellComponents/VideoCell";
import { IconButtonCell } from "../component/cellComponents/IconButtonCell";
import { EditActionCell } from "../component/cellComponents/EditActionsCell";
import { klona as clone } from "klona";

const ReactTableComponent = lazy(() =>
  retryPromise(() => import("../component")),
);
const defaultFilter = [
  {
    column: "",
    operator: OperatorTypes.OR,
    value: "",
    condition: "",
  },
];

class TableWidgetV2 extends BaseWidget<TableWidgetProps, WidgetState> {
  editTimer: number | null = null;

  static getPropertyPaneConfig() {
    return tablePropertyPaneConfig;
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

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
      editableCell: {},
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
      updatedRow: `{{this.triggeredRow}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRowIndex",
      selectedRowIndices: "defaultSelectedRowIndices",
    };
  }

  /*
   * Function to get the table columns with appropriate render functions
   * based on columnType
   */
  getTableColumns = () => {
    const { columnWidthMap = {}, orderedTableColumns = [] } = this.props;
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];

    const { componentWidth } = this.getComponentDimensions();
    let totalColumnWidth = 0;

    if (isArray(orderedTableColumns)) {
      orderedTableColumns.forEach((column: any) => {
        const isHidden = !column.isVisible;
        const columnData = {
          id: column.id,
          Header: column.label,
          alias: column.alias,
          accessor: (row: any) => row[column.alias],
          width: columnWidthMap[column.id] || DEFAULT_COLUMN_WIDTH,
          minWidth: COLUMN_MIN_WIDTH,
          draggable: true,
          isHidden: false,
          isAscOrder: column.isAscOrder,
          isDerived: column.isDerived,
          metaProperties: {
            isHidden: isHidden,
            type: column.columnType,
            format: column.outputFormat || "",
            inputFormat: column.inputFormat || "",
          },
          columnProperties: column,
          Cell: (props: any): JSX.Element => {
            return this.renderCell(props, column, componentWidth);
          },
        };

        const isAllCellVisible: boolean | boolean[] = column.isCellVisible;

        /*
         * If all cells are not visible or column itself is not visible,
         * set isHidden and push it to hiddenColumns array else columns array
         */
        if (
          (isBoolean(isAllCellVisible) && !isAllCellVisible) ||
          (isArray(isAllCellVisible) &&
            isAllCellVisible.every((visibility) => visibility === false)) ||
          isHidden
        ) {
          columnData.isHidden = true;
          hiddenColumns.push(columnData);
        } else {
          totalColumnWidth += columnData.width;
          columns.push(columnData);
        }
      });
    }

    if (totalColumnWidth < componentWidth) {
      const lastColumnIndex = columns.length - 1;

      if (columns[lastColumnIndex]) {
        const lastColumnWidth =
          columns[lastColumnIndex].width || DEFAULT_COLUMN_WIDTH;
        const remainingWidth = componentWidth - totalColumnWidth;

        columns[lastColumnIndex].width =
          lastColumnWidth +
          (remainingWidth < DEFAULT_COLUMN_WIDTH
            ? DEFAULT_COLUMN_WIDTH
            : remainingWidth);
      }
    }

    if (hiddenColumns.length && this.props.renderMode === RenderModes.CANVAS) {
      columns = columns.concat(hiddenColumns);
    }

    return columns.filter((column: ReactTableColumnProps) => !!column.id);
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    if (isArray(tableData)) {
      return tableData.map((row, rowIndex) => {
        const newRow: { [key: string]: any } = {};

        columns.forEach((column) => {
          const { alias } = column;
          let value = row[alias];

          if (column.metaProperties) {
            switch (column.metaProperties.type) {
              case ColumnTypes.DATE:
                let isValidDate = true;
                const outputFormat = _.isArray(column.metaProperties.format)
                  ? column.metaProperties.format[rowIndex]
                  : column.metaProperties.format;
                let inputFormat;

                try {
                  const type = _.isArray(column.metaProperties.inputFormat)
                    ? column.metaProperties.inputFormat[rowIndex]
                    : column.metaProperties.inputFormat;

                  if (
                    type !== DateInputFormat.EPOCH &&
                    type !== DateInputFormat.MILLISECONDS
                  ) {
                    inputFormat = type;
                    moment(value as MomentInput, inputFormat);
                  } else if (!isNumber(value)) {
                    isValidDate = false;
                  }
                } catch (e) {
                  isValidDate = false;
                }

                if (isValidDate && value) {
                  try {
                    if (
                      column.metaProperties.inputFormat ===
                      DateInputFormat.MILLISECONDS
                    ) {
                      value = Number(value);
                    } else if (
                      column.metaProperties.inputFormat ===
                      DateInputFormat.EPOCH
                    ) {
                      value = 1000 * Number(value);
                    }

                    newRow[alias] = moment(
                      value as MomentInput,
                      inputFormat,
                    ).format(outputFormat);
                  } catch (e) {
                    log.debug("Unable to parse Date:", { e });
                    newRow[alias] = "";
                  }
                } else if (value) {
                  newRow[alias] = "Invalid Value";
                } else {
                  newRow[alias] = "";
                }
                break;
              default:
                let data;

                if (_.isString(value) || _.isNumber(value)) {
                  data = value;
                } else if (isNil(value)) {
                  data = "";
                } else {
                  data = JSON.stringify(value);
                }

                newRow[alias] = data;
                break;
            }
          }
        });

        /*
         * Inject the edited cell value from the editableCell object
         */
        if (this.props.editableCell.index === rowIndex) {
          const { column, value } = this.props.editableCell;

          newRow[column] = value;
        }

        return newRow;
      });
    } else {
      return [];
    }
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
    const { tableData = [], primaryColumns = {} } = this.props;

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
        const columnProperties = getDefaultColumnProperties(
          columnKey,
          hashedColumnKey,
          index,
          this.props.widgetName,
        );

        newTableColumns[columnProperties.id] = {
          ...columnProperties,
          ...tableStyles,
        };
      }
    });

    const derivedColumns: Record<string, ColumnProperties> = getDerivedColumns(
      primaryColumns,
    );

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
          !_.isEqual(_.sortBy(newColumnIds), _.sortBy(existingDerivedColumnIds))
        ) {
          propertiesToAdd["columnOrder"] = Object.keys(tableColumns);
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

  componentDidMount() {
    const { tableData } = this.props;

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

    // Check if tableData is modifed
    const isTableDataModified = !equal(
      this.props.tableData,
      prevProps.tableData,
    );

    // If the user has changed the tableData OR
    // The binding has returned a new value
    if (isTableDataModified) {
      this.updateMetaRowData(
        prevProps.filteredTableData,
        this.props.filteredTableData,
      );

      this.resetWidgetDefault();

      const newColumnIds: string[] = getAllTableColumnKeys(
        this.props.tableData,
      );
      const primaryColumnIds = Object.keys(primaryColumns).filter(
        (id: string) => !primaryColumns[id].isDerived,
      );

      if (xor(newColumnIds, primaryColumnIds).length > 0) {
        const newTableColumns = this.createTablePrimaryColumns();

        if (newTableColumns) {
          this.updateColumnProperties(newTableColumns);
        }
      }
    }

    /*
     * Clear transient table data and editablecell when tableData changes
     */
    if (isTableDataModified) {
      this.props.updateWidgetMetaProperty("transientTableData", {});
      this.props.updateWidgetMetaProperty("editableCell", {});
    }

    if (!pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    //check if pageNo does not excede the max Page no, due to change of totalRecordsCount
    if (serverSidePaginationEnabled && totalRecordsCount) {
      const maxAllowedPageNumber = Math.ceil(totalRecordsCount / pageSize);

      if (pageNo > maxAllowedPageNumber) {
        this.props.updateWidgetMetaProperty("pageNo", maxAllowedPageNumber);
      }
    } else if (
      serverSidePaginationEnabled !== prevProps.serverSidePaginationEnabled
    ) {
      //reset pageNo when serverSidePaginationEnabled is toggled
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    /*
     * When defaultSelectedRowIndex or defaultSelectedRowIndices
     * is changed from property pane
     */
    if (
      !isEqual(defaultSelectedRowIndex, prevProps.defaultSelectedRowIndex) ||
      !isEqual(defaultSelectedRowIndices, prevProps.defaultSelectedRowIndices)
    ) {
      this.updateSelectedRowIndex();
    }

    this.resetPageNo(prevProps);

    this.resetRowSelectionProperties(prevProps);
  }

  resetPageNo = (prevProps: TableWidgetProps) => {
    const { onPageSizeChange, pageSize } = this.props;

    if (pageSize !== prevProps.pageSize) {
      if (onPageSizeChange) {
        this.props.updateWidgetMetaProperty("pageNo", 1, {
          triggerPropertyName: "onPageSizeChange",
          dynamicString: onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      } else {
        this.props.updateWidgetMetaProperty("pageNo", 1);
      }
    }
  };

  resetRowSelectionProperties = (prevProps: TableWidgetProps) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    // reset selectedRowIndices and selectedRowIndex to defaults
    if (multiRowSelection !== prevProps.multiRowSelection) {
      if (multiRowSelection) {
        if (
          defaultSelectedRowIndices &&
          _.isArray(defaultSelectedRowIndices) &&
          defaultSelectedRowIndices.every((i) => _.isFinite(i))
        ) {
          this.props.updateWidgetMetaProperty(
            "selectedRowIndices",
            defaultSelectedRowIndices,
          );
        }

        this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
      } else {
        if (!isNil(defaultSelectedRowIndex) && defaultSelectedRowIndex > -1) {
          this.props.updateWidgetMetaProperty(
            "selectedRowIndex",
            defaultSelectedRowIndex,
          );
        }

        this.props.updateWidgetMetaProperty("selectedRowIndices", []);
      }
    }
  };

  /*
   *  Function to reset filter and triggeredRowIndex when
   *  component props change
   */
  resetWidgetDefault = () => {
    const defaultFilter = [
      {
        column: "",
        operator: OperatorTypes.OR,
        value: "",
        condition: "",
      },
    ];

    this.props.updateWidgetMetaProperty("filters", defaultFilter);
    this.props.updateWidgetMetaProperty("triggeredRowIndex", -1);
  };

  /*
   * Function to update selectedRowIndices & selectedRowIndex from
   * defaultSelectedRowIndices & defaultSelectedRowIndex respectively
   */
  updateSelectedRowIndex = () => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        defaultSelectedRowIndices,
      );
    } else {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndex",
        defaultSelectedRowIndex,
      );
    }
  };

  /*
   * Function to update selectedRow details when order of tableData changes
   */
  updateMetaRowData = (
    oldTableData: Array<Record<string, unknown>>,
    newTableData: Array<Record<string, unknown>>,
  ) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
      primaryColumnId,
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

      this.props.updateWidgetMetaProperty("selectedRowIndices", indices);
    } else {
      const index = getSelectRowIndex(
        oldTableData,
        newTableData,
        defaultSelectedRowIndex,
        selectedRowIndex,
        primaryColumnId,
      );

      this.props.updateWidgetMetaProperty("selectedRowIndex", index);
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
    this.resetSelectedRowIndex();
    this.props.updateWidgetMetaProperty("filters", filters);

    // Reset Page only when a filter is added
    if (!isEmpty(xorWith(filters, defaultFilter, isEqual))) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
  };

  toggleDrag = (disable: boolean) => {
    this.disableDrag(disable);
  };

  getPageView() {
    const {
      totalRecordsCount,
      delimiter,
      pageSize,
      filteredTableData = [],
      isVisibleDownload,
      isVisibleFilters,
      isVisiblePagination,
      isVisibleSearch,
    } = this.props;
    const tableColumns = this.getTableColumns() || [];
    const transformedData = this.transformData(filteredTableData, tableColumns);
    const isVisibleHeaderOptions =
      isVisibleDownload ||
      isVisibleFilters ||
      isVisiblePagination ||
      isVisibleSearch;

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    return (
      <Suspense fallback={<Skeleton />}>
        <ReactTableComponent
          accentColor={this.props.accentColor}
          applyFilter={this.updateFilters}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          columnWidthMap={this.props.columnWidthMap}
          columns={tableColumns}
          compactMode={this.props.compactMode || CompactModeTypes.DEFAULT}
          delimiter={delimiter}
          disableDrag={this.toggleDrag}
          editMode={this.props.renderMode === RenderModes.CANVAS}
          editableCell={this.props.editableCell}
          filters={this.props.filters}
          handleReorderColumn={this.handleReorderColumn}
          handleResizeColumn={this.handleResizeColumn}
          height={componentHeight}
          isLoading={this.props.isLoading}
          isSortable={this.props.isSortable ?? true}
          isVisibleDownload={isVisibleDownload}
          isVisibleFilters={isVisibleFilters}
          isVisiblePagination={isVisiblePagination}
          isVisibleSearch={isVisibleSearch}
          multiRowSelection={this.props.multiRowSelection}
          nextPageClick={this.handleNextPageClick}
          onBulkEditDiscard={this.onBulkEditDiscard}
          onBulkEditSave={this.onBulkEditSave}
          onRowClick={this.handleRowClick}
          pageNo={this.props.pageNo}
          pageSize={
            isVisibleHeaderOptions ? Math.max(1, pageSize) : pageSize + 1
          }
          prevPageClick={this.handlePrevPageClick}
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
          sortTableColumn={this.handleColumnSorting}
          tableData={transformedData}
          totalRecordsCount={totalRecordsCount}
          triggerRowSelection={this.props.triggerRowSelection}
          unSelectAllRow={this.unSelectAllRow}
          updatePageNo={this.updatePageNumber}
          widgetId={this.props.widgetId}
          widgetName={this.props.widgetName}
          width={componentWidth}
        />
      </Suspense>
    );
  }

  handleReorderColumn = (columnOrder: string[]) => {
    columnOrder = columnOrder.map((alias) => this.getColumnIdByAlias(alias));

    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnOrder", columnOrder);
    } else {
      this.props.updateWidgetMetaProperty("columnOrder", columnOrder);
    }
  };

  handleColumnSorting = (columnAccessor: string, isAsc: boolean) => {
    const columnId = this.getColumnIdByAlias(columnAccessor);
    this.resetSelectedRowIndex(false);

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

    this.props.updateWidgetMetaProperty("sortOrder", sortOrderProps, {
      triggerPropertyName: "onSort",
      dynamicString: this.props.onSort,
      event: {
        type: EventType.ON_SORT,
      },
    });
  };

  handleResizeColumn = (columnWidthMap: { [key: string]: number }) => {
    if (this.props.renderMode === RenderModes.CANVAS) {
      super.updateWidgetProperty("columnWidthMap", columnWidthMap);
    } else {
      this.props.updateWidgetMetaProperty("columnWidthMap", columnWidthMap);
    }
  };

  handleSearchTable = (searchKey: any) => {
    const { multiRowSelection, onSearchTextChanged } = this.props;

    /*
     * Clear rowSelection to avoid selecting filtered rows
     * based on stale selection indices
     */
    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty("selectedRowIndices", []);
    } else {
      this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
    }

    this.props.updateWidgetMetaProperty("pageNo", 1);
    this.props.updateWidgetMetaProperty("searchText", searchKey, {
      triggerPropertyName: "onSearchTextChanged",
      dynamicString: onSearchTextChanged,
      event: {
        type: EventType.ON_SEARCH,
      },
    });
  };

  /*
   * Function to handle customColumn button type click interactions
   */
  onColumnEvent = ({
    rowIndex,
    action,
    onComplete = noop,
    triggerPropertyName,
    eventType,
    row,
  }: OnColumnEventArgs) => {
    const { filteredTableData = [] } = this.props;

    try {
      row = row || filteredTableData[rowIndex];

      if (action) {
        this.props.updateWidgetMetaProperty(
          "triggeredRowIndex",
          row?.[ORIGINAL_INDEX_KEY],
          {
            triggerPropertyName: triggerPropertyName,
            dynamicString: action,
            event: {
              type: eventType,
              callback: onComplete,
            },
            globalContext: { currentRow: row },
          },
        );
      } else {
        onComplete();
      }
    } catch (error) {
      log.debug("Error parsing row action", error);
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
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
    }
  };

  handleRowClick = (row: Record<string, unknown>, selectedIndex: number) => {
    const {
      multiRowSelection,
      selectedRowIndex,
      selectedRowIndices,
    } = this.props;

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
    if (event) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
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
    const pageNo = (this.props.pageNo || 1) + 1;

    this.props.updateWidgetMetaProperty("pageNo", pageNo, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_NEXT_PAGE,
      },
    });

    if (this.props.onPageChange) {
      this.resetSelectedRowIndex();
    }
  };

  resetSelectedRowIndex = (skipDefault?: boolean) => {
    const {
      defaultSelectedRowIndex,
      defaultSelectedRowIndices,
      multiRowSelection,
    } = this.props;

    if (multiRowSelection) {
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        skipDefault ? [] : defaultSelectedRowIndices,
      );
    } else {
      this.props.updateWidgetMetaProperty(
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

    if (pageNo >= 1) {
      this.props.updateWidgetMetaProperty("pageNo", pageNo, {
        triggerPropertyName: "onPageChange",
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

  static getWidgetType(): WidgetType {
    return "TABLE_WIDGET_V2";
  }

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

  updateTransientTableData = (data: TransientDataPayload) => {
    const { __original_index__, ...transientData } = data;

    this.props.updateWidgetMetaProperty("transientTableData", {
      ...this.props.transientTableData,
      [__original_index__]: {
        ...this.props.transientTableData[__original_index__],
        ...transientData,
      },
    });
  };

  removeRowFromTransientTableData = (__original_index__: string) => {
    const newTransientTableData = clone(this.props.transientTableData);

    if (newTransientTableData) {
      delete newTransientTableData[__original_index__];

      this.props.updateWidgetMetaProperty(
        "transientTableData",
        newTransientTableData,
      );
    }
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

  renderCell = (props: any, column: any, componentWidth: number) => {
    const isHidden = !column.isVisible;
    const {
      filteredTableData = [],
      multiRowSelection,
      selectedRowIndex,
      selectedRowIndices,
      compactMode = CompactModeTypes.DEFAULT,
    } = this.props;

    const rowIndex: number = props.cell.row.index;
    const row = filteredTableData[rowIndex];
    const originalIndex = row[ORIGINAL_INDEX_KEY] ?? rowIndex;

    // cellProperties order or size does not change when filter/sorting/grouping is applied
    // on the data thus original index is needed to identify the column's cell property.
    const cellProperties = getCellProperties(column, originalIndex);
    let isSelected = false;

    if (this.props.transientTableData) {
      cellProperties.hasUnsavedChanged =
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
                isDisabled: cellProperties.isSaveDisabled,
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
                isDisabled: cellProperties.isDiscardDisabled,
                boxShadow: cellProperties.boxShadow,
              },
            ]}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellVisible={cellProperties.isCellVisible ?? true}
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

      /*
       * Selec column type is not available for users yet
       * Keeping this changes for future usuage
       */
      // case ColumnTypes.SELECT:
      //   const onSelect = (value: string) => {
      //     this.updateTransientTableData({
      //       __original_index__: this.getRowOriginalIndex(rowIndex),
      //       [props.cell.column.columnProperties.alias]: value,
      //     });

      //     if (column.onOptionChange) {
      //       this.onColumnEvent({
      //         rowIndex,
      //         action: column.onOptionChange,
      //         triggerPropertyName: "onOptionChange",
      //         eventType: EventType.ON_OPTION_CHANGE,
      //       });
      //     }
      //   };

      //   return (
      //     <SelectCell
      //       allowCellWrapping={cellProperties.allowCellWrapping}
      //       borderRadius={cellProperties.borderRadius}
      //       cellBackground={cellProperties.cellBackground}
      //       compactMode={compactMode}
      //       fontStyle={cellProperties.fontStyle}
      //       horizontalAlignment={cellProperties.horizontalAlignment}
      //       isCellEditable={cellProperties.isCellEditable}
      //       isCellVisible={cellProperties.isCellVisible ?? true}
      //       isEditable={isColumnEditable}
      //       isHidden={isHidden}
      //       onItemSelect={onSelect}
      //       options={column.selectOptions}
      //       tableWidth={componentWidth}
      //       textColor={cellProperties.textColor}
      //       textSize={cellProperties.textSize}
      //       value={props.cell.value}
      //       verticalAlignment={cellProperties.verticalAlignment}
      //       width={
      //         this.props.columnWidthMap?.[column.id] || DEFAULT_COLUMN_WIDTH
      //       }
      //     />
      //   );

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
        return (
          <MenuButtonCell
            allowCellWrapping={cellProperties.allowCellWrapping}
            borderRadius={
              cellProperties.borderRadius || this.props.borderRadius
            }
            boxShadow={cellProperties.boxShadow}
            cellBackground={cellProperties.cellBackground}
            compactMode={compactMode}
            fontStyle={cellProperties.fontStyle}
            horizontalAlignment={cellProperties.horizontalAlignment}
            iconAlign={cellProperties.iconAlign}
            iconName={cellProperties.menuButtoniconName || undefined}
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
            menuVariant={cellProperties.menuVariant ?? DEFAULT_MENU_VARIANT}
            onCommandClick={(action: string, onComplete?: () => void) =>
              this.onColumnEvent({
                rowIndex,
                action,
                onComplete,
                triggerPropertyName: "onClick",
                eventType: EventType.ON_CLICK,
              })
            }
            rowIndex={originalIndex}
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
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );

      default:
        const isCellEditMode =
          props.cell.column.alias === this.props.editableCell.column &&
          rowIndex === this.props.editableCell.index;
        return (
          <DefaultCell
            accentColor={this.props.accentColor}
            alias={props.cell.column.columnProperties.alias}
            allowCellWrapping={cellProperties.allowCellWrapping}
            cellBackground={cellProperties.cellBackground}
            columnType={column.columnType}
            compactMode={compactMode}
            disabledEditIcon={
              this.props.inlineEditingSaveOption ===
                InlineEditingSaveOptions.ROW_LEVEL &&
              this.props.updatedRowIndices.length &&
              this.props.updatedRowIndices.indexOf(originalIndex) === -1
            }
            displayText={cellProperties.displayText}
            fontStyle={cellProperties.fontStyle}
            hasUnsavedChanged={cellProperties.hasUnsavedChanged}
            horizontalAlignment={cellProperties.horizontalAlignment}
            isCellEditMode={isCellEditMode}
            isCellEditable={
              (isColumnEditable && cellProperties.isCellEditable) ?? false
            }
            isCellVisible={cellProperties.isCellVisible ?? true}
            isHidden={isHidden}
            onCellTextChange={this.onEditableCellTextChange}
            onDiscardString={props.cell.column.columnProperties.onDiscard}
            onSubmitString={props.cell.column.columnProperties.onSubmit}
            rowIndex={rowIndex}
            tableWidth={componentWidth}
            textColor={cellProperties.textColor}
            textSize={cellProperties.textSize}
            toggleCellEditMode={this.toggleCellEditMode}
            value={props.cell.value}
            verticalAlignment={cellProperties.verticalAlignment}
          />
        );
    }
  };

  onEditableCellTextChange = (data: string) => {
    this.props.updateWidgetMetaProperty("editableCell", {
      ...this.props.editableCell,
      value: data,
    });
  };

  toggleCellEditMode = (
    enable: boolean,
    rowIndex: number,
    alias: string,
    value: string | number,
    onSubmit: string,
    action: EditableCellActions,
  ) => {
    if (enable) {
      if (this.editTimer) {
        clearTimeout(this.editTimer);
      }

      this.props.updateWidgetMetaProperty("editableCell", {
        column: alias,
        index: rowIndex,
        value: value,
        // To revert back to previous on discard
        initialValue: value,
      });

      /*
       * We need to clear the selectedRowIndex and selectedRowIndices
       * if the rows are sorted, to avoid selectedRow jumping to
       * different page.
       */
      if (this.props.sortOrder.column) {
        if (this.props.multiRowSelection) {
          this.props.updateWidgetMetaProperty("selectedRowIndices", []);
        } else {
          this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
        }
      }
    } else {
      if (
        action === EditableCellActions.SAVE &&
        value !== this.props.editableCell.initialValue
      ) {
        this.updateTransientTableData({
          __original_index__: this.getRowOriginalIndex(rowIndex),
          [alias]: value,
        });

        if (onSubmit) {
          this.onColumnEvent({
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
      }

      /*
       * We need to let the evaulations compute derived property (filteredTableData)
       * before we clear the editableCell to avoid the text flickering
       */
      this.editTimer = setTimeout(() => {
        this.props.updateWidgetMetaProperty("editableCell", {});
      }, 100);
    }
  };
}

export default TableWidgetV2;
