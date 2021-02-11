import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import {
  compare,
  ConditionFunctions,
  getAllTableColumnKeys,
  renderActions,
  renderCell,
  reorderColumns,
  sortTableFunction,
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
import { isNumber, isString, isUndefined, isEqual } from "lodash";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta, { WithMeta } from "./MetaHOC";

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
      defaultSelectedRow: VALIDATION_TYPES.DEFAULT_SELECTED_ROW,
      pageSize: VALIDATION_TYPES.NUMBER,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      selectedRowIndex: undefined,
      selectedRowIndices: undefined,
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
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onRowSelected: true,
      onPageChange: true,
      onSearchTextChanged: true,
      onPageSizeChange: true,
      columnActions: true,
    };
  }

  static getDerivedPropertiesMap() {
    return {
      pageSize: `{{function() {
          const TABLE_SIZES = {
           ${CompactModeTypes.DEFAULT}: {
            COLUMN_HEADER_HEIGHT: 38,
            TABLE_HEADER_HEIGHT: 42,
            ROW_HEIGHT: 40,
            ROW_FONT_SIZE: 14,
           },
           ${CompactModeTypes.SHORT}: {
            COLUMN_HEADER_HEIGHT: 38,
            TABLE_HEADER_HEIGHT: 42,
            ROW_HEIGHT: 20,
            ROW_FONT_SIZE: 12,
           },
           ${CompactModeTypes.TALL}: {
            COLUMN_HEADER_HEIGHT: 38,
            TABLE_HEADER_HEIGHT: 42,
            ROW_HEIGHT: 60,
            ROW_FONT_SIZE: 18,
           },
          };
          const compactMode = this.compactMode || "${CompactModeTypes.DEFAULT}";
          const componentHeight = (this.bottomRow - this.topRow) * this.parentRowSpace;
          const tableSizes = TABLE_SIZES[compactMode];
          let pageSize= Math.floor((componentHeight - tableSizes.TABLE_HEADER_HEIGHT - tableSizes.COLUMN_HEADER_HEIGHT) / tableSizes.ROW_HEIGHT);
          if (
            componentHeight -
              (tableSizes.TABLE_HEADER_HEIGHT +
                tableSizes.COLUMN_HEADER_HEIGHT +
                tableSizes.ROW_HEIGHT * pageSize) >
            0
          ) {
            pageSize += 1;
          }
          return pageSize;
        }()
      }}`,
      triggerRowSelection: "{{!!this.onRowSelected}}",
    };
  }

  getTableColumns = (tableData: Array<Record<string, unknown>>) => {
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    const {
      columnNameMap,
      columnSizeMap,
      columnTypeMap,
      columnActions,
    } = this.props;
    if (tableData.length) {
      const columnKeys: string[] = getAllTableColumnKeys(tableData);
      const { componentWidth } = this.getComponentDimensions();
      const sortedColumn = this.props.sortedColumn;
      let totalColumnSizes = 0;
      const defaultColumnWidth = 150;
      for (const i in columnSizeMap) {
        totalColumnSizes += columnSizeMap[i];
      }
      for (let index = 0; index < columnKeys.length; index++) {
        const i = columnKeys[index];
        const columnName: string =
          columnNameMap && columnNameMap[i] ? columnNameMap[i] : i;
        const columnType: {
          type: string;
          format?: string;
          inputFormat?: string;
        } =
          columnTypeMap && columnTypeMap[i]
            ? columnTypeMap[i]
            : { type: ColumnTypes.TEXT };
        const isHidden =
          !!this.props.hiddenColumns && this.props.hiddenColumns.includes(i);
        const columnData = {
          Header: columnName,
          accessor: i,
          width:
            columnSizeMap && columnSizeMap[i]
              ? columnSizeMap[i]
              : defaultColumnWidth,
          minWidth: 60,
          draggable: true,
          isHidden: false,
          isAscOrder:
            sortedColumn && sortedColumn.column === i
              ? sortedColumn.asc
              : undefined,
          metaProperties: {
            isHidden: isHidden,
            type: columnType.type,
            format: columnType.format,
            inputFormat: columnType.inputFormat,
          },
          Cell: (props: any) => {
            return renderCell(
              props.cell.value,
              columnType.type,
              isHidden,
              componentWidth,
            );
          },
        };
        if (isHidden) {
          columnData.isHidden = true;
          hiddenColumns.push(columnData);
        } else {
          columns.push(columnData);
        }
      }
      columns = reorderColumns(columns, this.props.columnOrder || []);
      if (columnActions?.length) {
        columns.push({
          Header:
            columnNameMap && columnNameMap["actions"]
              ? columnNameMap["actions"]
              : "Actions",
          accessor: "actions",
          width: 150,
          minWidth: 60,
          draggable: true,
          Cell: (props: any) => {
            return renderActions({
              isSelected: props.row.isSelected,
              columnActions: columnActions,
              onCommandClick: this.onCommandClick,
            });
          },
        });
      }
      //If resized column sizes is less than total table width then reisze last column to maximum available width
      if (totalColumnSizes < componentWidth) {
        const lastColumnIndex = columns.length - 1;
        let remainingColumnsSize = 0;
        for (let i = 0; i < columns.length - 1; i++) {
          remainingColumnsSize += columns[i].width || defaultColumnWidth;
        }
        columns[lastColumnIndex].width =
          componentWidth - remainingColumnsSize < defaultColumnWidth
            ? defaultColumnWidth
            : componentWidth - remainingColumnsSize; //Min remaining width to be defaultColumnWidth
      }
      if (
        hiddenColumns.length &&
        this.props.renderMode === RenderModes.CANVAS
      ) {
        columns = columns.concat(hiddenColumns);
      }
    }
    return columns;
  };

  transformData = (
    tableData: Array<Record<string, unknown>>,
    columns: ReactTableColumnProps[],
  ) => {
    const updatedTableData = [];
    for (let row = 0; row < tableData.length; row++) {
      const data: { [key: string]: any } = tableData[row];
      if (data !== null && data !== undefined) {
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
                  if (type !== "Epoch" && type !== "Milliseconds") {
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
                    value = Number(value);
                  } else if (column.metaProperties.inputFormat === "Epoch") {
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
    }
    return updatedTableData;
  };

  filterTableData = () => {
    const { searchText, sortedColumn, filters, tableData } = this.props;
    const columns = this.getTableColumns(tableData);
    if (!tableData || !tableData.length) {
      return [];
    }
    let sortedTableData: any[];
    const searchKey = searchText ? searchText.toUpperCase() : "";
    if (sortedColumn) {
      const sortColumn = sortedColumn.column;
      const sortOrder = sortedColumn.asc;
      sortedTableData = sortTableFunction(
        tableData,
        columns,
        sortColumn,
        sortOrder,
      );
    } else {
      sortedTableData = [...tableData];
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

  getSelectedRow = (
    filteredTableData: Array<Record<string, unknown>>,
    selectedRowIndex?: number,
  ) => {
    if (
      selectedRowIndex === undefined ||
      selectedRowIndex === null ||
      selectedRowIndex === -1
    ) {
      const columnKeys: string[] = getAllTableColumnKeys(this.props.tableData);
      const selectedRow: { [key: string]: any } = {};
      for (let i = 0; i < columnKeys.length; i++) {
        selectedRow[columnKeys[i]] = "";
      }
      return selectedRow;
    }
    return filteredTableData[selectedRowIndex];
  };

  getSelectedRows = (
    filteredTableData: Array<Record<string, unknown>>,
    selectedRowIndices: Array<number>,
  ) => {
    return filteredTableData.filter(
      (item: Record<string, unknown>, i: number) => {
        return selectedRowIndices.includes(i);
      },
    );
  };

  componentDidMount() {
    const filteredTableData = this.filterTableData();
    this.props.updateWidgetMetaProperty("filteredTableData", filteredTableData);
    const { selectedRowIndex } = this.props;
    this.props.updateWidgetMetaProperty(
      "selectedRow",
      this.getSelectedRow(filteredTableData, selectedRowIndex),
    );
  }

  componentDidUpdate(prevProps: TableWidgetProps) {
    const tableDataUpdated =
      JSON.stringify(this.props.tableData) !==
      JSON.stringify(prevProps.tableData);
    if (
      tableDataUpdated ||
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
        const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : -1;
        this.props.updateWidgetMetaProperty(
          "selectedRowIndex",
          selectedRowIndex,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(filteredTableData, selectedRowIndex),
        );
      } else {
        const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          this.getSelectedRows(filteredTableData, selectedRowIndices),
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
          this.getSelectedRows(filteredTableData, selectedRowIndices),
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
    if (!isEqual(this.props.defaultSelectedRow, prevProps.defaultSelectedRow)) {
      //Runs only when defaultSelectedRow is changed from property pane
      if (!this.props.multiRowSelection) {
        const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : -1;
        this.props.updateWidgetMetaProperty(
          "selectedRowIndex",
          selectedRowIndex,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRow",
          this.getSelectedRow(this.props.filteredTableData, selectedRowIndex),
        );
      } else {
        const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
          ? this.props.defaultSelectedRow
          : [];
        this.props.updateWidgetMetaProperty(
          "selectedRowIndices",
          selectedRowIndices,
        );
        this.props.updateWidgetMetaProperty(
          "selectedRows",
          this.getSelectedRows(
            this.props.filteredTableData,
            selectedRowIndices,
          ),
        );
      }
    }
    if (this.props.pageSize !== prevProps.pageSize) {
      super.executeAction({
        dynamicString: this.props.onPageSizeChange,
        event: {
          type: EventType.ON_PAGE_SIZE_CHANGE,
        },
      });
    }
  }

  getSelectedRowIndexes = (selectedRowIndices: string) => {
    return selectedRowIndices
      ? selectedRowIndices.split(",").map((i) => Number(i))
      : [];
  };

  getPageView() {
    const {
      tableData,
      hiddenColumns,
      filteredTableData,
      pageSize,
    } = this.props;
    const computedSelectedRowIndices = Array.isArray(
      this.props.selectedRowIndices,
    )
      ? this.props.selectedRowIndices
      : [];
    const tableColumns = this.getTableColumns(tableData);

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
          columnNameMap={this.props.columnNameMap}
          columnTypeMap={this.props.columnTypeMap}
          columnOrder={this.props.columnOrder}
          triggerRowSelection={this.props.triggerRowSelection}
          pageSize={Math.max(1, pageSize)}
          onCommandClick={this.onCommandClick}
          selectedRowIndex={
            this.props.selectedRowIndex === undefined
              ? -1
              : this.props.selectedRowIndex
          }
          multiRowSelection={this.props.multiRowSelection}
          selectedRowIndices={computedSelectedRowIndices}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          onRowClick={this.handleRowClick}
          pageNo={pageNo}
          nextPageClick={this.handleNextPageClick}
          prevPageClick={this.handlePrevPageClick}
          updatePageNo={this.updatePageNumber}
          updateHiddenColumns={(hiddenColumns?: string[]) => {
            super.updateWidgetProperty("hiddenColumns", hiddenColumns);
          }}
          updateColumnType={(columnTypeMap: {
            [key: string]: { type: string; format: string };
          }) => {
            super.updateWidgetProperty("columnTypeMap", columnTypeMap);
          }}
          updateColumnName={(columnNameMap: { [key: string]: string }) => {
            super.updateWidgetProperty("columnNameMap", columnNameMap);
          }}
          handleResizeColumn={(columnSizeMap: { [key: string]: number }) => {
            if (this.props.renderMode === RenderModes.CANVAS) {
              super.updateWidgetProperty("columnSizeMap", columnSizeMap);
            } else {
              this.props.updateWidgetMetaProperty(
                "columnSizeMap",
                columnSizeMap,
              );
            }
          }}
          handleReorderColumn={(columnOrder: string[]) => {
            super.updateWidgetProperty("columnOrder", columnOrder);
          }}
          columnSizeMap={this.props.columnSizeMap}
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
            this.props.updateWidgetMetaProperty("compactMode", compactMode);
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

  handleRowClick = (rowData: Record<string, unknown>, index: number) => {
    if (this.props.multiRowSelection) {
      const selectedRowIndices = this.props.selectedRowIndices
        ? [...this.props.selectedRowIndices]
        : [];
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
    if (!this.props.multiRowSelection) {
      const selectedRowIndex = isNumber(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : -1;
      this.props.updateWidgetMetaProperty("selectedRowIndex", selectedRowIndex);
      this.props.updateWidgetMetaProperty(
        "selectedRow",
        this.getSelectedRow(this.props.filteredTableData, selectedRowIndex),
      );
    } else {
      const selectedRowIndices = Array.isArray(this.props.defaultSelectedRow)
        ? this.props.defaultSelectedRow
        : [];
      this.props.updateWidgetMetaProperty(
        "selectedRowIndices",
        selectedRowIndices,
      );
      this.props.updateWidgetMetaProperty(
        "selectedRows",
        this.getSelectedRows(this.props.filteredTableData, selectedRowIndices),
      );
    }
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
export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  value: any;
}
export interface TableColumnMetaProps {
  isHidden: boolean;
  format?: string;
  type: string;
  inputFormat?: string;
}
export interface ReactTableColumnProps {
  Header: string;
  accessor: string;
  width?: number;
  minWidth: number;
  draggable: boolean;
  isHidden?: boolean;
  isAscOrder?: boolean;
  metaProperties?: TableColumnMetaProps;
  Cell: (props: any) => JSX.Element;
}

export interface TableWidgetProps extends WidgetProps, WithMeta {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchText: string;
  defaultSearchText: string;
  defaultSelectedRow?: number | number[];
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
  sortedColumn?: {
    column: string;
    asc: boolean;
  };
}

export default TableWidget;
export const ProfiledTableWidget = Sentry.withProfiler(withMeta(TableWidget));
