import React, { memo } from "react";
import styled from "styled-components";
import { getDragHandlers } from "widgets/TableWidgetV2/widget/utilities";
import { RenderEmptyRows } from "../cellComponents/EmptyCell";
import { HeaderCell } from "../cellComponents/HeaderCell";
import { renderHeaderCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";
import { useAppsmithTable } from "../TableContext";

const StyledHeaderGroup = styled.div<{
  headerWidth: number;
}>`
  display: flex;
  width: ${(props) => props.headerWidth}px !important;
`;
const TableColumnHeader = () => {
  const {
    accentColor,
    borderRadius,
    columns,
    disableDrag,
    enableDrag,
    handleAllRowSelectClick,
    handleReorderColumn,
    headerGroups,
    multiRowSelection,
    rowSelectionState,
    totalColumnsWidth,
  } = useAppsmithTable();
  const headerWidth = React.useMemo(
    () =>
      multiRowSelection && totalColumnsWidth
        ? MULTISELECT_CHECKBOX_WIDTH + totalColumnsWidth
        : totalColumnsWidth,
    [multiRowSelection, totalColumnsWidth],
  );

  const currentDraggedColumn = React.useRef<string>("");
  const columnOrder = columns.map((col) => col.alias);
  const {
    onDrag,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDragStart,
    onDrop,
  } = getDragHandlers(
    columns,
    currentDraggedColumn,
    handleReorderColumn,
    columnOrder,
  );

  return (
    <div className="thead" onMouseLeave={enableDrag} onMouseOver={disableDrag}>
      {/* TODO: Fix this the next time the file is edited */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {headerGroups.map((headerGroup: any, index: number) => {
        const headerRowProps = {
          ...headerGroup.getHeaderGroupProps(),
        };

        return (
          <StyledHeaderGroup
            {...headerRowProps}
            className="tr header"
            headerWidth={headerWidth}
            key={index}
          >
            {multiRowSelection &&
              renderHeaderCheckBoxCell(
                handleAllRowSelectClick,
                rowSelectionState,
                accentColor,
                borderRadius,
              )}

            {/* TODO: Fix this the next time the file is edited */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {headerGroup.headers.map((column: any, columnIndex: number) => {
              const stickyRightModifier = !column.isHidden
                ? columnIndex !== 0 &&
                  columns[columnIndex - 1].sticky === StickyType.RIGHT &&
                  columns[columnIndex - 1].isHidden
                  ? "sticky-right-modifier"
                  : ""
                : "";

              return (
                <HeaderCell
                  column={column}
                  columnIndex={columnIndex}
                  columnName={column.Header}
                  columnOrder={columnOrder}
                  isAscOrder={column.isAscOrder}
                  isHidden={column.isHidden}
                  key={columnIndex}
                  onDrag={onDrag}
                  onDragEnd={onDragEnd}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDragOver={onDragOver}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  stickyRightModifier={stickyRightModifier}
                />
              );
            })}
          </StyledHeaderGroup>
        );
      })}
      {headerGroups.length === 0 && RenderEmptyRows(1, {})}
    </div>
  );
};

export default memo(TableColumnHeader);
