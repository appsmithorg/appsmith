import React, { CSSProperties, Key, useContext } from "react";
import { Row as ReactTableRowType } from "react-table";
import { ListChildComponentProps } from "react-window";
import { BodyContext } from ".";
import { renderEmptyRows } from "../cellComponents/EmptyCell";
import { renderBodyCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import { StickyType } from "../Constants";

type RowType = {
  className?: string;
  index: number;
  row: ReactTableRowType<Record<string, unknown>>;
  style?: ListChildComponentProps["style"];
};

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

  if (!isAddRowInProgress) {
    rowProps["role"] = "button";
  }

  return (
    <div
      {...rowProps}
      className={`tr ${isRowSelected ? "selected-row" : ""} ${props.className ||
        ""} ${isAddRowInProgress && props.index === 0 ? "new-row" : ""}`}
      data-rowindex={props.index}
      key={key}
      onClick={(e) => {
        props.row.toggleRowSelected();
        selectTableRow?.(props.row);
        e.stopPropagation();
      }}
    >
      {multiRowSelection &&
        renderBodyCheckBoxCell(isRowSelected, accentColor, borderRadius)}
      {props.row.cells.map((cell, cellIndex) => {
        return (
          <div
            {...cell.getCellProps()}
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
