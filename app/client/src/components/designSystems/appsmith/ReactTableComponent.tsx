import React, { useEffect } from "react";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import Table from "./Table";
import { RenderMode, RenderModes } from "constants/WidgetConstants";
import { debounce } from "lodash";
import { getMenuOptions, renderActions, renderCell } from "./TableUtilities";

export interface ReactTableColumnProps {
  Header: string;
  accessor: string;
  width: number;
  minWidth: number;
  draggable: boolean;
  isHidden?: boolean;
  Cell: (props: any) => JSX.Element;
}

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
  content: string;
  isSelected: boolean;
  closeOnClick: boolean;
  onClick: (columnIndex: number) => void;
}

interface ReactTableComponentProps {
  widgetId: string;
  searchKey: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isLoading: boolean;
  renderMode: RenderMode;
  width: number;
  height: number;
  pageSize: number;
  tableData: object[];
  columnOrder?: string[];
  disableDrag: (disable: boolean) => void;
  onRowClick: (rowData: object, rowIndex: number) => void;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  updatePageNo: Function;
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  resetSelectedRowIndex: Function;
  nextPageClick: Function;
  prevPageClick: Function;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  columnActions?: ColumnAction[];
  selectedRowIndex: number;
  hiddenColumns?: string[];
  columnNameMap?: { [key: string]: string };
  columnTypeMap?: {
    [key: string]: {
      type: string;
      format: string;
    };
  };
  columnSizeMap?: { [key: string]: number };
  updateColumnType: Function;
  updateColumnName: Function;
  handleResizeColumn: Function;
  handleReorderColumn: Function;
  searchTableData: (searchKey: any) => void;
}

const ReactTableComponent = (props: ReactTableComponentProps) => {
  let dragged = -1;
  const getAllTableColumnKeys = () => {
    const tableData: object[] = props.tableData;
    const columnKeys: string[] = [];
    for (let i = 0, tableRowCount = tableData.length; i < tableRowCount; i++) {
      const row = tableData[i];
      for (const key in row) {
        if (!columnKeys.includes(key)) {
          columnKeys.push(key);
        }
      }
    }
    return columnKeys;
  };

  const reorderColumns = (columns: ReactTableColumnProps[]) => {
    const columnOrder = props.columnOrder || [];
    const reorderedColumns = [];
    const reorderedFlagMap: { [key: string]: boolean } = {};
    for (let index = 0; index < columns.length; index++) {
      const accessor = columnOrder[index];
      if (accessor) {
        const column = columns.filter((col: ReactTableColumnProps) => {
          return col.accessor === accessor;
        });
        if (column.length && !reorderedFlagMap[column[0].accessor]) {
          reorderedColumns.push(column[0]);
          reorderedFlagMap[column[0].accessor] = true;
        } else if (!reorderedFlagMap[columns[index].accessor]) {
          reorderedColumns.push(columns[index]);
          reorderedFlagMap[columns[index].accessor] = true;
        }
      } else if (!reorderedFlagMap[columns[index].accessor]) {
        reorderedColumns.push(columns[index]);
        reorderedFlagMap[columns[index].accessor] = true;
      }
    }
    if (reorderedColumns.length < columns.length) {
      for (let index = 0; index < columns.length; index++) {
        if (!reorderedFlagMap[columns[index].accessor]) {
          reorderedColumns.push(columns[index]);
          reorderedFlagMap[columns[index].accessor] = true;
        }
      }
    }
    return reorderedColumns;
  };
  const getTableColumns = () => {
    const tableData: object[] = props.tableData;
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    if (tableData.length) {
      const columnKeys: string[] = getAllTableColumnKeys();
      for (let index = 0; index < columnKeys.length; index++) {
        const i = columnKeys[index];
        const columnName: string =
          props.columnNameMap && props.columnNameMap[i]
            ? props.columnNameMap[i]
            : i;
        const columnType: { type: string; format?: string } =
          props.columnTypeMap && props.columnTypeMap[i]
            ? props.columnTypeMap[i]
            : { type: "text" };
        const columnSize: number =
          props.columnSizeMap && props.columnSizeMap[i]
            ? props.columnSizeMap[i]
            : 150;
        const isHidden =
          !!props.hiddenColumns && props.hiddenColumns.includes(i);
        const columnData = {
          Header: columnName,
          accessor: i,
          width: columnSize,
          minWidth: 60,
          draggable: true,
          isHidden: false,
          Cell: (props: any) => {
            return renderCell(
              props.cell.value,
              props.cell.row.index,
              columnType.type,
              isHidden,
              props.widgetId,
              columnType.format,
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
      columns = reorderColumns(columns);
      if (props.columnActions?.length) {
        columns.push({
          Header:
            props.columnNameMap && props.columnNameMap["actions"]
              ? props.columnNameMap["actions"]
              : "Actions",
          accessor: "actions",
          width: 150,
          minWidth: 60,
          draggable: true,
          Cell: () => {
            return renderActions({
              columnActions: props.columnActions,
              onCommandClick: props.onCommandClick,
            });
          },
        });
      }
      if (hiddenColumns.length && props.renderMode === RenderModes.CANVAS) {
        columns = columns.concat(hiddenColumns);
      }
    }
    return columns;
  };

  const tableColumns = React.useMemo(getTableColumns, [
    JSON.stringify({
      data: props.tableData,
      columnNameMap: props.columnNameMap,
      columnActions: props.columnActions,
      hiddenColumns: props.hiddenColumns,
      columnSizeMap: props.columnSizeMap,
      columnTypeMap: props.columnTypeMap,
      columnOrder: props.columnOrder,
    }),
  ]);
  useEffect(() => {
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
          let columnOrder = props.columnOrder;
          if (columnOrder === undefined) {
            columnOrder = getAllTableColumnKeys();
          }
          const draggedColumn = tableColumns[dragged].accessor;
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
    const column = tableColumns[columnIndex];
    const columnId = column.accessor;
    const columnType =
      props.columnTypeMap && props.columnTypeMap[columnId]
        ? props.columnTypeMap[columnId].type
        : "";
    const format =
      props.columnTypeMap && props.columnTypeMap[columnId]
        ? props.columnTypeMap[columnId].format
        : "";
    const isColumnHidden = !!(
      props.hiddenColumns && props.hiddenColumns.includes(columnId)
    );
    const columnMenuOptions: ColumnMenuOptionProps[] = getMenuOptions({
      columnAccessor: columnId,
      isColumnHidden,
      columnType,
      format,
      hideColumn: hideColumn,
      updateColumnType: updateColumnType,
      handleUpdateCurrencySymbol: handleUpdateCurrencySymbol,
      handleDateFormatUpdate: handleDateFormatUpdate,
    });
    return columnMenuOptions;
  };

  const hideColumn = (columnIndex: number, isColumnHidden: boolean) => {
    const column = tableColumns[columnIndex];
    let hiddenColumns = props.hiddenColumns || [];
    if (!isColumnHidden) {
      hiddenColumns.push(column.accessor);
      const columnOrder = props.columnOrder || [];
      if (columnOrder.includes(column.accessor)) {
        columnOrder.splice(columnOrder.indexOf(column.accessor), 1);
        props.handleReorderColumn(columnOrder);
      }
    } else {
      hiddenColumns = hiddenColumns.filter(item => {
        return item !== column.accessor;
      });
    }
    props.updateHiddenColumns(hiddenColumns);
  };

  const updateColumnType = (columnIndex: number, columnType: string) => {
    const column = tableColumns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: columnType,
      format: "",
    };
    props.updateColumnType(columnTypeMap);
  };

  const handleColumnNameUpdate = (columnIndex: number, columnName: string) => {
    const column = tableColumns[columnIndex];
    const columnNameMap = props.columnNameMap || {};
    columnNameMap[column.accessor] = columnName;
    props.updateColumnName(columnNameMap);
  };

  const handleUpdateCurrencySymbol = (
    columnIndex: number,
    currencySymbol: string,
  ) => {
    const column = tableColumns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "currency",
      format: currencySymbol,
    };
    props.updateColumnType(columnTypeMap);
  };

  const handleDateFormatUpdate = (columnIndex: number, dateFormat: string) => {
    const column = tableColumns[columnIndex];
    const columnTypeMap = props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "date",
      format: dateFormat,
    };
    props.updateColumnType(columnTypeMap);
  };

  const handleResizeColumn = (columnIndex: number, columnWidth: string) => {
    const column = tableColumns[columnIndex];
    const columnSizeMap = props.columnSizeMap || {};
    const width = Number(columnWidth.split("px")[0]);
    columnSizeMap[column.accessor] = width;
    props.handleResizeColumn(columnSizeMap);
  };

  const selectTableRow = (
    row: { original: object; index: number },
    isSelected: boolean,
  ) => {
    if (!isSelected) {
      props.onRowClick(row.original, row.index);
    } else {
      props.resetSelectedRowIndex();
    }
  };

  return (
    <Table
      isLoading={props.isLoading}
      width={props.width}
      height={props.height}
      pageSize={props.pageSize || 1}
      widgetId={props.widgetId}
      searchKey={props.searchKey}
      columns={tableColumns}
      hiddenColumns={props.hiddenColumns}
      updateHiddenColumns={props.updateHiddenColumns}
      data={props.tableData}
      displayColumnActions={props.renderMode === RenderModes.CANVAS}
      columnNameMap={props.columnNameMap}
      getColumnMenu={getColumnMenu}
      handleColumnNameUpdate={handleColumnNameUpdate}
      handleResizeColumn={debounce(handleResizeColumn, 300)}
      selectTableRow={selectTableRow}
      pageNo={props.pageNo - 1}
      updatePageNo={props.updatePageNo}
      nextPageClick={() => {
        props.nextPageClick();
      }}
      prevPageClick={() => {
        props.prevPageClick();
      }}
      serverSidePaginationEnabled={props.serverSidePaginationEnabled}
      selectedRowIndex={props.selectedRowIndex}
      disableDrag={() => {
        props.disableDrag(true);
      }}
      enableDrag={() => {
        props.disableDrag(false);
      }}
      searchTableData={debounce(props.searchTableData, 500)}
    />
  );
};

export default ReactTableComponent;
