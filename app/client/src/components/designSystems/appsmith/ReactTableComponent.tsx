/* eslint-disable @typescript-eslint/ban-types */

import React from "react";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import Table from "components/designSystems/appsmith/Table";
import { debounce } from "lodash";
import { getMenuOptions } from "components/designSystems/appsmith/TableUtilities";
import {
  ColumnTypes,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
  ColumnProperties,
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
  primaryColumns?: ColumnProperties[];
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
  updatePrimaryColumnProperties: (columnProperties: ColumnProperties[]) => void;
}

const ReactTableComponent = (props: ReactTableComponentProps) => {
  const getColumnMenu = (columnIndex: number) => {
    const column = props.columns[columnIndex];
    const columnId = column.accessor;
    const columnType = column.metaProperties?.type || "";
    const format = column.metaProperties?.format || "";
    const isColumnHidden = !!column.isHidden;
    const inputFormat = column.metaProperties?.inputFormat || "";
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
    if (!column.isDerived) {
      const primaryColumns = props.primaryColumns || [];
      primaryColumns[columnIndex].isVisible = isColumnHidden;
      props.updatePrimaryColumnProperties([...primaryColumns]);
    }
  };

  const updateColumnType = (columnIndex: number, columnType: string) => {
    updateColumnProperties(columnIndex, {
      columnType: columnType,
      inputFormat: undefined,
      outputFormat: undefined,
    });
  };

  const handleColumnNameUpdate = (columnIndex: number, columnName: string) => {
    updateColumnProperties(columnIndex, {
      label: columnName,
    });
  };

  const handleUpdateCurrencySymbol = (
    columnIndex: number,
    currencySymbol: string,
  ) => {
    updateColumnProperties(columnIndex, {
      columnType: "currency",
      outputFormat: currencySymbol,
    });
  };

  const handleDateFormatUpdate = (
    columnIndex: number,
    dateFormat: string,
    dateInputFormat?: string,
  ) => {
    updateColumnProperties(columnIndex, {
      columnType: "date",
      outputFormat: dateFormat,
      inputFormat: dateInputFormat,
    });
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

  const handleResizeColumn = (columnIndex: number, columnWidth: string) => {
    const width = Number(columnWidth.split("px")[0]);
    updateColumnProperties(columnIndex, {
      width: width,
    });
  };

  const selectTableRow = (
    row: { original: Record<string, unknown>; index: number },
    isSelected: boolean,
  ) => {
    if (!isSelected || !!props.multiRowSelection) {
      props.onRowClick(row.original, row.index);
    }
  };

  const updateColumnProperties = (
    columnIndex: number,
    properties: Partial<ColumnProperties>,
  ) => {
    const column = props.columns[columnIndex];
    if (!column.isDerived) {
      const primaryColumns = props.primaryColumns || [];
      primaryColumns[columnIndex] = {
        ...primaryColumns[columnIndex],
        ...properties,
      };
      props.updatePrimaryColumnProperties([...primaryColumns]);
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
      updateHiddenColumns={props.updateHiddenColumns}
      data={props.tableData}
      editMode={props.editMode}
      getColumnMenu={getColumnMenu}
      handleColumnNameUpdate={handleColumnNameUpdate}
      handleResizeColumn={debounce(handleResizeColumn, 300)}
      sortTableColumn={sortTableColumn}
      selectTableRow={selectTableRow}
      pageNo={props.pageNo - 1}
      updatePageNo={props.updatePageNo}
      columnActions={props.columnActions}
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
