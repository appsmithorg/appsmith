import React from "react";
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

export class ReactTableComponent extends React.Component<
  ReactTableComponentProps
> {
  private dragged = -1;
  componentDidMount() {
    this.mountEvents();
  }

  mountEvents() {
    const headers = Array.prototype.slice.call(
      document.querySelectorAll(
        `#table${this.props.widgetId} .draggable-header`,
      ),
    );
    const columns = this.getTableColumns();
    headers.forEach((header, i) => {
      header.setAttribute("draggable", true);

      header.ondragstart = (e: React.DragEvent<HTMLDivElement>) => {
        header.style =
          "background: #efefef; border-radius: 4px; z-index: 100; width: 100%; text-overflow: none; overflow: none;";
        e.stopPropagation();
        this.dragged = i;
      };

      header.ondrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
      };

      header.ondragend = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        e.stopPropagation();
        setTimeout(() => (this.dragged = -1), 1000);
      };

      // the dropped header
      header.ondragover = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== this.dragged && this.dragged !== -1) {
          if (this.dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (this.dragged < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragenter = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== this.dragged && this.dragged !== -1) {
          if (this.dragged > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (this.dragged < i) {
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
        if (i !== this.dragged && this.dragged !== -1) {
          e.preventDefault();
          let columnOrder = this.props.columnOrder;
          if (columnOrder === undefined) {
            columnOrder = this.props.tableData.length
              ? Object.keys(this.props.tableData[0])
              : [];
          }
          const draggedColumn = columns[this.dragged].accessor;
          columnOrder.splice(this.dragged, 1);
          columnOrder.splice(i, 0, draggedColumn);
          this.props.handleReorderColumn(columnOrder);
        } else {
          this.dragged = -1;
        }
      };
    });
  }

  getAllTableColumnKeys = () => {
    const tableData: object[] = this.props.tableData;
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

  getTableColumns = () => {
    const tableData: object[] = this.props.tableData;
    let columns: ReactTableColumnProps[] = [];
    const hiddenColumns: ReactTableColumnProps[] = [];
    if (tableData.length) {
      const columnKeys: string[] = this.getAllTableColumnKeys();
      for (let index = 0, length = columnKeys.length; index < length; index++) {
        const i = columnKeys[index];
        const columnName: string =
          this.props.columnNameMap && this.props.columnNameMap[i]
            ? this.props.columnNameMap[i]
            : i;
        const columnType: { type: string; format?: string } =
          this.props.columnTypeMap && this.props.columnTypeMap[i]
            ? this.props.columnTypeMap[i]
            : { type: "text" };
        const columnSize: number =
          this.props.columnSizeMap && this.props.columnSizeMap[i]
            ? this.props.columnSizeMap[i]
            : 150;
        const isHidden =
          !!this.props.hiddenColumns && this.props.hiddenColumns.includes(i);
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
              this.props.widgetId,
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
      columns = this.reorderColumns(columns);
      if (this.props.columnActions?.length) {
        columns.push({
          Header:
            this.props.columnNameMap && this.props.columnNameMap["actions"]
              ? this.props.columnNameMap["actions"]
              : "Actions",
          accessor: "actions",
          width: 150,
          minWidth: 60,
          draggable: true,
          Cell: () => {
            return renderActions({
              columnActions: this.props.columnActions,
              onCommandClick: this.props.onCommandClick,
            });
          },
        });
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

  reorderColumns = (columns: ReactTableColumnProps[]) => {
    const columnOrder = this.props.columnOrder || [];
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

  getColumnMenu = (columnIndex: number) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnId = column.accessor;
    const columnType =
      this.props.columnTypeMap && this.props.columnTypeMap[columnId]
        ? this.props.columnTypeMap[columnId].type
        : "";
    const format =
      this.props.columnTypeMap && this.props.columnTypeMap[columnId]
        ? this.props.columnTypeMap[columnId].format
        : "";
    const isColumnHidden = !!(
      this.props.hiddenColumns && this.props.hiddenColumns.includes(columnId)
    );
    const columnMenuOptions: ColumnMenuOptionProps[] = getMenuOptions({
      columnAccessor: columnId,
      isColumnHidden,
      columnType,
      format,
      hideColumn: this.hideColumn,
      updateColumnType: this.updateColumnType,
      handleUpdateCurrencySymbol: this.handleUpdateCurrencySymbol,
      handleDateFormatUpdate: this.handleDateFormatUpdate,
    });
    return columnMenuOptions;
  };

  hideColumn = (columnIndex: number, isColumnHidden: boolean) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    let hiddenColumns = this.props.hiddenColumns || [];
    if (!isColumnHidden) {
      hiddenColumns.push(column.accessor);
      const columnOrder = this.props.columnOrder || [];
      if (columnOrder.includes(column.accessor)) {
        columnOrder.splice(columnOrder.indexOf(column.accessor), 1);
        this.props.handleReorderColumn(columnOrder);
      }
    } else {
      hiddenColumns = hiddenColumns.filter(item => {
        return item !== column.accessor;
      });
    }
    this.props.updateHiddenColumns(hiddenColumns);
  };

  updateColumnType = (columnIndex: number, columnType: string) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnTypeMap = this.props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: columnType,
      format: "",
    };
    this.props.updateColumnType(columnTypeMap);
  };

  handleColumnNameUpdate = (columnIndex: number, columnName: string) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnNameMap = this.props.columnNameMap || {};
    columnNameMap[column.accessor] = columnName;
    this.props.updateColumnName(columnNameMap);
  };

  handleUpdateCurrencySymbol = (
    columnIndex: number,
    currencySymbol: string,
  ) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnTypeMap = this.props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "currency",
      format: currencySymbol,
    };
    this.props.updateColumnType(columnTypeMap);
  };

  handleDateFormatUpdate = (columnIndex: number, dateFormat: string) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnTypeMap = this.props.columnTypeMap || {};
    columnTypeMap[column.accessor] = {
      type: "date",
      format: dateFormat,
    };
    this.props.updateColumnType(columnTypeMap);
  };

  handleResizeColumn = (columnIndex: number, columnWidth: string) => {
    const columns = this.getTableColumns();
    const column = columns[columnIndex];
    const columnSizeMap = this.props.columnSizeMap || {};
    const width = Number(columnWidth.split("px")[0]);
    columnSizeMap[column.accessor] = width;
    this.props.handleResizeColumn(columnSizeMap);
  };

  selectTableRow = (
    row: { original: object; index: number },
    isSelected: boolean,
  ) => {
    if (!isSelected) {
      this.props.onRowClick(row.original, row.index);
    } else {
      this.props.resetSelectedRowIndex();
    }
  };

  render() {
    const columns = this.getTableColumns();
    return (
      <Table
        isLoading={this.props.isLoading}
        width={this.props.width}
        height={this.props.height}
        pageSize={this.props.pageSize || 1}
        widgetId={this.props.widgetId}
        searchKey={this.props.searchKey}
        columns={columns}
        columnOrder={(this.props.columnOrder || []).join(",")}
        hiddenColumns={this.props.hiddenColumns}
        updateHiddenColumns={this.props.updateHiddenColumns}
        data={this.props.tableData}
        displayColumnActions={this.props.renderMode === RenderModes.CANVAS}
        columnNameMap={this.props.columnNameMap}
        getColumnMenu={this.getColumnMenu}
        handleColumnNameUpdate={this.handleColumnNameUpdate}
        handleResizeColumn={debounce(this.handleResizeColumn, 300)}
        selectTableRow={this.selectTableRow}
        pageNo={this.props.pageNo - 1}
        updatePageNo={this.props.updatePageNo}
        nextPageClick={() => {
          this.props.nextPageClick();
        }}
        prevPageClick={() => {
          this.props.prevPageClick();
        }}
        serverSidePaginationEnabled={this.props.serverSidePaginationEnabled}
        selectedRowIndex={this.props.selectedRowIndex}
        disableDrag={() => {
          this.props.disableDrag(true);
        }}
        enableDrag={() => {
          this.props.disableDrag(false);
        }}
        searchTableData={debounce(this.props.searchTableData, 500)}
      />
    );
  }
}

export default ReactTableComponent;
