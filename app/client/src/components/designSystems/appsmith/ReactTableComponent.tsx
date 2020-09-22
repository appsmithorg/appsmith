import React, { useEffect } from "react";
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
  tableData: object[];
  columnOrder?: string[];
  primaryColumns?: ColumnProperties[];
  disableDrag: (disable: boolean) => void;
  onRowClick: (rowData: object, rowIndex: number) => void;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  updatePageNo: Function;
  updateHiddenColumns: (hiddenColumns?: string[]) => void;
  sortTableColumn: (column: string, asc: boolean) => void;
  nextPageClick: Function;
  prevPageClick: Function;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  columnActions?: ColumnAction[];
  selectedRowIndex: number;
  selectedRowIndices: number[];
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  handleReorderColumn: Function;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  columns: ReactTableColumnProps[];
  compactMode?: CompactMode;
  updateCompactMode: (compactMode: CompactMode) => void;
  updatePrimaryColumnProperties: (columnProperties: ColumnProperties[]) => void;
}

const ReactTableComponent = (props: ReactTableComponentProps) => {
  useEffect(() => {
    let dragIndex = -1;
    const headers = Array.prototype.slice.call(
      document.querySelectorAll(`#table${props.widgetId} .draggable-header`),
    );
    headers.forEach((header, i) => {
      header.setAttribute("draggable", true);

      header.ondragstart = (e: React.DragEvent<HTMLDivElement>) => {
        header.style =
          "background: #efefef; border-radius: 4px; z-index: 100; width: 100%; text-overflow: none; overflow: none;";
        e.stopPropagation();
        dragIndex = i;
      };

      header.ondrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
      };

      header.ondragend = (e: React.DragEvent<HTMLDivElement>) => {
        header.style = "";
        e.stopPropagation();
        setTimeout(() => (dragIndex = -1), 1000);
      };

      // the dropped header
      header.ondragover = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragIndex && dragIndex !== -1) {
          if (dragIndex > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragIndex < i) {
            header.parentElement.className =
              "th header-reorder highlight-right";
          }
        }
        e.preventDefault();
      };

      header.ondragenter = (e: React.DragEvent<HTMLDivElement>) => {
        if (i !== dragIndex && dragIndex !== -1) {
          if (dragIndex > i) {
            header.parentElement.className = "th header-reorder highlight-left";
          } else if (dragIndex < i) {
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
        if (i !== dragIndex && dragIndex !== -1) {
          e.preventDefault();
          handleColumnDrag(dragIndex, i);
        } else {
          dragIndex = -1;
        }
      };
    });
  });

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

  const handleColumnDrag = (dragIndex: number, targetIndex: number) => {
    const primaryColumns: ColumnProperties[] = props.primaryColumns || [];
    const column: ColumnProperties = primaryColumns.splice(dragIndex, 1)[0];
    primaryColumns.splice(targetIndex, 0, column);
    props.updatePrimaryColumnProperties([...primaryColumns]);
  };

  const hideColumn = (columnIndex: number, isColumnHidden: boolean) => {
    const column = props.columns[columnIndex];
    if (!column.isDerived) {
      const primaryColumns = props.primaryColumns || [];
      // const updatedPrimaryColumn = primaryColumns[columnIndex];
      // updatedPrimaryColumn.isVisible = isColumnHidden;
      // primaryColumns.splice(columnIndex, 1);
      // primaryColumns.push(updatedPrimaryColumn);
      primaryColumns[columnIndex].isVisible = isColumnHidden;
      props.updatePrimaryColumnProperties([...primaryColumns]);
    }
  };

  const updateColumnType = (columnIndex: number, columnType: string) => {
    updateColumnProperties(columnIndex, {
      type: columnType,
      format: undefined,
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
      type: "currency",
      format: {
        output: currencySymbol,
      },
    });
  };

  const handleDateFormatUpdate = (
    columnIndex: number,
    dateFormat: string,
    dateInputFormat?: string,
  ) => {
    updateColumnProperties(columnIndex, {
      type: "date",
      format: {
        output: dateFormat,
        input: dateInputFormat,
      },
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
    row: { original: object; index: number },
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
