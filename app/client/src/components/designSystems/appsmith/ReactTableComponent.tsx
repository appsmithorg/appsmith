/* eslint-disable @typescript-eslint/ban-types */

import React, { useEffect } from "react";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import Table from "components/designSystems/appsmith/Table";
import { getMenuOptions } from "components/designSystems/appsmith/TableUtilities";
import {
  ColumnTypes,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
} from "widgets/TableWidget";
import { EventType } from "constants/ActionConstants";

export interface ColumnMenuOptionProps {
  content: string | JSX.Element;
  closeOnClick?: boolean;
  isSelected?: boolean;
  editColumnName?: boolean;
  columnAccessor?: string;
  id?: string;
  category?: boolean;
  options?: ColumnMenuSubOptionProps[];
  onClick?: (columnIndex: number, isSelected: boolean) => void;
}

export interface ColumnMenuSubOptionProps {
  content: string | JSX.Element;
  isSelected?: boolean;
  closeOnClick?: boolean;
  onClick?: (columnIndex: number) => void;
  id?: string;
  category?: boolean;
  isHeader?: boolean;
}

interface ReactTableComponentProps {
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isLoading: boolean;
  editMode: boolean;
  width: number;
  height: number;
  pageSize: number;
  tableData: Array<Record<string, unknown>>;
  columnOrder?: string[];
  disableDrag: (disable: boolean) => void;
  onRowClick: (rowData: Record<string, unknown>, rowIndex: number) => void;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  sortTableColumn: (column: string, asc: boolean) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  columnActions?: ColumnAction[];
  selectedRowIndex: number;
  selectedRowIndices: number[];
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  columnNameMap?: { [key: string]: string };
  triggerRowSelection: boolean;
  columnTypeMap?: {
    [key: string]: {
      type: string;
      format: string;
      inputFormat?: string;
    };
  };
  columnSizeMap?: { [key: string]: number };
  updateColumnType: (columnTypeMap: {
    [key: string]: { type: string; format: string };
  }) => void;
  updateColumnName: (columnNameMap: { [key: string]: string }) => void;
  handleResizeColumn: (columnSizeMap: { [key: string]: number }) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  columns: ReactTableColumnProps[];
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
}

const ReactTableComponent = (props: ReactTableComponentProps) => {
  useEffect(() => {
    let dragged = -1;
    const headers = Array.prototype.slice.call(
      document.querySelectorAll(`#table${props.widgetId} .draggable-header`),
    );
    headers.forEach((header, i) => {
      header.setAttribute("draggable", true);

      header.ondragstart = (e: React.DragEvent<HTMLDivElement>) => {
        header.style =
          "background: #efefef; border-radius: 4px; z-index: 100; width: 100%; text-overflow: none; overflow: none;";
        e.stopPropagation();
        dragged = i;
      };

      header.ondrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
      };

      header.ondragend = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        e.stopPropagation();
        setTimeout(() => (dragged = -1), 1000);
      };

      // the dropped header
      header.ondragover = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragged && dragged !== -1) {
          if (dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragged < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragenter = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragged && dragged !== -1) {
          if (dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragged < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragleave = (e: React.DragEvent<HTMLDivElement>) => {
        header.parentElement.className = "th header-reorder";
        e.preventDefault();
      };

      header.ondrop = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        header.parentElement.className = "th header-reorder";
        if (i !== dragged && dragged !== -1) {
          e.preventDefault();
          const columnOrder = props.columnOrder
            ? [...props.columnOrder]
            : props.columns.map((item) => item.accessor);
          const draggedColumn = props.columns[dragged].accessor;
          columnOrder.splice(dragged, 1);
          columnOrder.splice(i, 0, draggedColumn);
          props.handleReorderColumn(columnOrder);
        } else {
          dragged = -1;
        }
      };
    });
  });

  const getColumnMenu = (columnIndex: number) => {
    const column = props.columns[columnIndex];
    const columnId = column.accessor;
    const columnType =
      props.columnTypeMap && props.columnTypeMap[columnId]
        ? props.columnTypeMap[columnId].type
        : "";
    const format =
      props.columnTypeMap && props.columnTypeMap[columnId]
        ? props.columnTypeMap[columnId].format
        : "";
    const inputFormat =
      props.columnTypeMap && props.columnTypeMap[columnId]
        ? props.columnTypeMap[columnId].inputFormat
        : "";
    const isColumnHidden = !!(
      props.hiddenColumns && props.hiddenColumns.includes(columnId)
    );
    const columnMenuOptions: ColumnMenuOptionProps[] = getMenuOptions({
      columnAccessor: columnId,
      isColumnHidden,
      columnType,
      format,
      inputFormat,
      hideColumn: hideColumn,
      updateColumnType: updateColumnType,
      handleUpdateCurrencySymbol: handleUpdateCurrencySymbol,
      handleDateFormatUpdate: handleDateFormatUpdate,
    });
    return columnMenuOptions;
  };

  const hideColumn = (columnIndex: number, isColumnHidden: boolean) => {
    const column = props.columns[columnIndex];
    let hiddenColumns = props.hiddenColumns || [];
    if (!isColumnHidden) {
      hiddenColumns.push(column.accessor);
      const columnOrder = props.columnOrder || [];
      if (columnOrder.includes(column.accessor)) {
        columnOrder.splice(columnOrder.indexOf(column.accessor), 1);
        props.handleReorderColumn(columnOrder);
      }
    } else {
      hiddenColumns = hiddenColumns.filter((item) => {
        return item !== column.accessor;
      });
    }
    props.updateHiddenColumns(hiddenColumns);
  };

  const updateColumnType = (columnIndex: number, columnType: string) => {
    const column = props.columns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: columnType,
      format: "",
    };
    props.updateColumnType(columnTypeMap);
  };

  const handleColumnNameUpdate = (columnIndex: number, columnName: string) => {
    const column = props.columns[columnIndex];
    const columnNameMap = props.columnNameMap || {};
    columnNameMap[column.accessor] = columnName;
    props.updateColumnName(columnNameMap);
  };

  const handleUpdateCurrencySymbol = (
    columnIndex: number,
    currencySymbol: string,
  ) => {
    const column = props.columns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "currency",
      format: currencySymbol,
    };
    props.updateColumnType(columnTypeMap);
  };

  const handleDateFormatUpdate = (
    columnIndex: number,
    dateFormat: string,
    dateInputFormat?: string,
  ) => {
    const column = props.columns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "date",
      format: dateFormat,
    };
    if (dateInputFormat) {
      columnTypeMap[column.accessor].inputFormat = dateInputFormat;
    }
    props.updateColumnType(columnTypeMap);
  };

  const sortTableColumn = (columnIndex: number, asc: boolean) => {
    if (columnIndex === -1) {
      props.sortTableColumn("", asc);
    } else {
      const column = props.columns[columnIndex];
      const columnType = column.metaProperties?.type || ColumnTypes.TEXT;
      if (
        columnType !== ColumnTypes.IMAGE &&
        columnType !== ColumnTypes.VIDEO
      ) {
        props.sortTableColumn(column.accessor, asc);
      }
    }
  };

  const selectTableRow = (
    row: { original: Record<string, unknown>; index: number },
    isSelected: boolean,
  ) => {
    if (!isSelected || !!props.multiRowSelection) {
      props.onRowClick(row.original, row.index);
    }
  };

  return (
    <Table
      isLoading={props.isLoading}
      width={props.width}
      height={props.height}
      pageSize={props.pageSize || 1}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      searchKey={props.searchKey}
      columns={props.columns}
      hiddenColumns={props.hiddenColumns}
      columnSizeMap={props.columnSizeMap}
      updateHiddenColumns={props.updateHiddenColumns}
      data={props.tableData}
      editMode={props.editMode}
      columnNameMap={props.columnNameMap}
      getColumnMenu={getColumnMenu}
      handleColumnNameUpdate={handleColumnNameUpdate}
      handleResizeColumn={props.handleResizeColumn}
      sortTableColumn={sortTableColumn}
      selectTableRow={selectTableRow}
      pageNo={props.pageNo - 1}
      updatePageNo={props.updatePageNo}
      columnActions={props.columnActions}
      triggerRowSelection={props.triggerRowSelection}
      nextPageClick={() => {
        props.nextPageClick();
      }}
      prevPageClick={() => {
        props.prevPageClick();
      }}
      serverSidePaginationEnabled={props.serverSidePaginationEnabled}
      selectedRowIndex={props.selectedRowIndex}
      selectedRowIndices={props.selectedRowIndices}
      disableDrag={() => {
        props.disableDrag(true);
      }}
      enableDrag={() => {
        props.disableDrag(false);
      }}
      searchTableData={props.searchTableData}
      filters={props.filters}
      applyFilter={props.applyFilter}
      compactMode={props.compactMode}
      updateCompactMode={props.updateCompactMode}
    />
  );
};

export default ReactTableComponent;
