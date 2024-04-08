import type { CSSProperties, Key } from "react";
import React, { useContext } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ListChildComponentProps } from "react-window";
import { BodyContext } from ".";
import { renderEmptyRows } from "../cellComponents/EmptyCell";
import { renderBodyCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";

interface RowType {
  className?: string;
  index: number;
  row: ReactTableRowType<Record<string, unknown>>;
  style?: ListChildComponentProps["style"];
}

export function Row(props: RowType) {
  const {
    accentColor,
    borderRadius,
    columns,
    isAddRowInProgress,
    multiRowSelection,
    prepareRow,
    primaryColumnId,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
  } = useContext(BodyContext);

  prepareRow?.(props.row);
  const rowProps = {
    ...props.row.getRowProps(),
    style: {
      display: "flex",
      ...(props.style || {}),
    },
  };
  const isRowSelected = multiRowSelection
    ? selectedRowIndices.includes(props.row.index)
    : props.row.index === selectedRowIndex;

  const key =
    (primaryColumnId && (props.row.original[primaryColumnId] as Key)) ||
    props.index;

  const onClickRow = (e: React.MouseEvent) => {
    props.row.toggleRowSelected();
    selectTableRow?.(props.row);
    e.stopPropagation();
  };

  return (
    <div
      {...rowProps}
      aria-checked={isRowSelected}
      className={`tr ${isRowSelected ? "selected-row" : ""} ${
        props.className || ""
      }`}
      data-is-new={isAddRowInProgress && props.index === 0 ? "" : undefined}
      data-rowindex={props.index}
      key={key}
      onClick={onClickRow}
    >
      {multiRowSelection &&
        renderBodyCheckBoxCell(isRowSelected, accentColor, borderRadius)}
      {props.row.cells.map((cell, cellIndex) => {
        const cellProperties = cell.getCellProps();

        cellProperties["style"] = {
          ...cellProperties.style,
          left:
            columns[cellIndex].sticky === StickyType.LEFT && multiRowSelection
              ? cell.column.totalLeft + MULTISELECT_CHECKBOX_WIDTH
              : cellProperties?.style?.left,
        };
        return (
          <div
            {...cellProperties}
            aria-hidden={columns[cellIndex].isHidden ? "true" : undefined}
            className={
              columns[cellIndex].isHidden
                ? "td hidden-cell"
                : `td${
                    cellIndex !== 0 &&
                    columns[cellIndex - 1].sticky === StickyType.RIGHT &&
                    columns[cellIndex - 1].isHidden
                      ? " sticky-right-modifier"
                      : ""
                  }`
            }
            data-colindex={cellIndex}
            data-rowindex={props.index}
            key={cellIndex}
          >
            {cell.render("Cell")}
          </div>
        );
      })}
    </div>
  );
}

export const EmptyRows = (props: {
  style?: CSSProperties;
  rowCount: number;
}) => {
  const {
    accentColor,
    borderRadius,
    columns,
    multiRowSelection,
    prepareRow,
    rows,
    width,
  } = useContext(BodyContext);

  return (
    <>
      {renderEmptyRows(
        props.rowCount,
        columns,
        width,
        rows,
        multiRowSelection,
        accentColor,
        borderRadius,
        props.style,
        prepareRow,
      )}
    </>
  );
};

export const EmptyRow = (props: { style?: CSSProperties }) => {
  const {
    accentColor,
    borderRadius,
    columns,
    multiRowSelection,
    prepareRow,
    rows,
    width,
  } = useContext(BodyContext);

  return renderEmptyRows(
    1,
    columns,
    width,
    rows,
    multiRowSelection,
    accentColor,
    borderRadius,
    props.style,
    prepareRow,
  )?.[0];
};
