import type { CSSProperties, Key } from "react";
import React, { useContext, useEffect, useRef } from "react";
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
  const { row, index } = props;
  const rowRef = useRef<HTMLDivElement>(null);
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
    rowHeights,
    rowNeedsMeasurement,
    listRef,
  } = useContext(BodyContext);

  useEffect(() => {
    if (
      rowNeedsMeasurement.current &&
      rowNeedsMeasurement.current[index] === false
    ) {
      return;
    }
    const element = rowRef.current;

    if (!element || !row) return;
    const cellIndexesWithAllowCellWrapping: number[] = [];
    try {
      // @ts-ignore
      row.cells.forEach((cell: any, index: number) => {
        if (cell.column.columnProperties.allowCellWrapping) {
          cellIndexesWithAllowCellWrapping.push(index);
        }
      });
    } catch (error) {}

    // Get all child elements
    const children = element.children;
    let totalHeight = 0;

    cellIndexesWithAllowCellWrapping.forEach((index: number) => {
      const child = children[index] as HTMLElement;
      const dynamicContent = child.querySelector(
        ".t--table-cell-tooltip-target",
      );
      if (dynamicContent) {
        const styles = window.getComputedStyle(dynamicContent);
        totalHeight +=
          (dynamicContent as HTMLElement).offsetHeight +
          parseFloat(styles.marginTop) +
          parseFloat(styles.marginBottom) +
          parseFloat(styles.paddingTop) +
          parseFloat(styles.paddingBottom);
      }
    });

    // Add padding of the container
    const styles = window.getComputedStyle(element);
    totalHeight +=
      parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    rowHeights.current && (rowHeights.current[index] = totalHeight);
    rowNeedsMeasurement.current && (rowNeedsMeasurement.current[index] = false);
    listRef && listRef.current?.resetAfterIndex(index);
  }, [index, row]);

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
      ref={rowRef}
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
