import type { Key } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ListChildComponentProps, VariableSizeList } from "react-window";
import { renderBodyCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";
import { useAppsmithTable } from "../TableContext";
import { useRowHeightMeasurement } from "../VirtualTable/useRowHeightMeasurement";
import useColumnVariableHeight from "../VirtualTable/useColumnVariableHeight";

interface RowType {
  className?: string;
  index: number;
  row: ReactTableRowType<Record<string, unknown>>;
  style?: ListChildComponentProps["style"];
  listRef?: React.RefObject<VariableSizeList>;
  rowHeights?: React.RefObject<{ [key: number]: number }>;
  rowNeedsMeasurement?: React.RefObject<{ [key: number]: boolean }>;
}

export function Row(props: RowType) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const {
    accentColor,
    borderRadius,
    columns,
    isAddRowInProgress,
    isInfiniteScrollEnabled,
    multiRowSelection,
    prepareRow,
    primaryColumnId,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
  } = useAppsmithTable();

  const wrappingColumns = useColumnVariableHeight(columns, props.row);

  useRowHeightMeasurement({
    index: props.index,
    row: props.row,
    rowRef,
    rowHeights: props.rowHeights,
    rowNeedsMeasurement: props.rowNeedsMeasurement,
    listRef: props.listRef,
    forceUpdate,
    isInfiniteScrollEnabled,
  });

  useEffect(() => {
    if (props.rowNeedsMeasurement && props.rowNeedsMeasurement.current) {
      props.rowNeedsMeasurement.current[props.index] = true;
    }

    setForceUpdate((prev) => prev + 1);
  }, [wrappingColumns]);

  prepareRow?.(props.row);
  const rowProps = {
    ...props.row.getRowProps(),
    style: {
      display: "flex",
      ...(props.style || {}),
    },
    ref: rowRef,
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
      className={`tr ${isRowSelected ? "selected-row" : ""} ${
        props.className || ""
      } ${isAddRowInProgress && props.index === 0 ? "new-row" : ""}`}
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
