import React, { memo } from "react";
import { getDragHandlers } from "widgets/wds/WDSTableWidget/widget/utilities";
import { HeaderCell } from "../cellComponents/HeaderCell";
import type { ReactTableColumnProps } from "../Constants";
import { StickyType } from "../Constants";
import type { Row as ReactTableRowType } from "react-table";
import { renderHeaderCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import { renderEmptyRows } from "../cellComponents/EmptyCell";

export interface TableColumnHeaderProps {
  enableDrag: () => void;
  disableDrag: () => void;
  multiRowSelection?: boolean;
  handleAllRowSelectClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  accentColor: string;
  borderRadius: string;
  headerGroups: any;
  canFreezeColumn?: boolean;
  editMode: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  isResizingColumn: React.MutableRefObject<boolean>;
  isSortable?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  columns: ReactTableColumnProps[];
  width: number;
  subPage: ReactTableRowType<Record<string, unknown>>[];
  prepareRow: any;
  headerWidth?: number;
  rowSelectionState: 0 | 1 | 2 | null;
  widgetId: string;
}

const TableColumnHeader = (props: TableColumnHeaderProps) => {
  const currentDraggedColumn = React.useRef<string>("");
  const columnOrder = props.columns.map((col) => col.alias);
  const {
    onDrag,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,
  } = getDragHandlers(
    props.columns,
    currentDraggedColumn,
    props.handleReorderColumn,
    columnOrder,
  );

  return (
    <thead onMouseLeave={props.enableDrag} onMouseOver={props.disableDrag}>
      {props.headerGroups.map((headerGroup: any, index: number) => {
        const headerRowProps = {
          ...headerGroup.getHeaderGroupProps(),
        };

        return (
          <tr
            {...headerRowProps}
            key={index}
            style={{ width: props.headerWidth }}
          >
            {props.multiRowSelection &&
              renderHeaderCheckBoxCell(
                props.handleAllRowSelectClick,
                props.rowSelectionState,
                props.accentColor,
                props.borderRadius,
              )}

            {headerGroup.headers.map((column: any, columnIndex: number) => {
              const stickyRightModifier = !column.isHidden
                ? columnIndex !== 0 &&
                  props.columns[columnIndex - 1].sticky === StickyType.RIGHT &&
                  props.columns[columnIndex - 1].isHidden
                  ? "sticky-right-modifier"
                  : ""
                : "";

              return (
                <HeaderCell
                  canFreezeColumn={props.canFreezeColumn}
                  column={column}
                  columnIndex={columnIndex}
                  columnName={column.Header}
                  columnOrder={columnOrder}
                  editMode={props.editMode}
                  handleColumnFreeze={props.handleColumnFreeze}
                  handleReorderColumn={props.handleReorderColumn}
                  isAscOrder={column.isAscOrder}
                  isHidden={column.isHidden}
                  isResizingColumn={props.isResizingColumn.current}
                  isSortable={props.isSortable}
                  key={columnIndex}
                  multiRowSelection={props.multiRowSelection}
                  onDrag={onDrag}
                  onDragEnd={onDragEnd}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  sortTableColumn={props.sortTableColumn}
                  stickyRightModifier={stickyRightModifier}
                  widgetId={props.widgetId}
                  width={column.width}
                />
              );
            })}
          </tr>
        );
      })}

      {props.headerGroups.length === 0 &&
        renderEmptyRows(
          1,
          props.columns,
          props.width,
          props.subPage,
          props.multiRowSelection,
          props.accentColor,
          props.borderRadius,
          {},
          props.prepareRow,
        )}
    </thead>
  );
};

export default memo(TableColumnHeader);
