import type { CSSProperties, Key } from "react";
import React, { useContext, useEffect, useRef, useState } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { ListChildComponentProps } from "react-window";
import { BodyContext } from ".";
import { renderEmptyRows } from "../cellComponents/EmptyCell";
import { renderBodyCheckBoxCell } from "../cellComponents/SelectionCheckboxCell";
import {
  MULTISELECT_CHECKBOX_WIDTH,
  StickyType,
  TABLE_SIZES,
} from "../Constants";
import useColumnVariableHeight from "./useColumnVariableHeight";

interface RowType {
  className?: string;
  index: number;
  row: ReactTableRowType<Record<string, unknown>>;
  style?: ListChildComponentProps["style"];
}

interface CellWithColumnProps {
  column: {
    columnProperties?: {
      allowCellWrapping?: boolean;
    };
  };
}

export function Row(props: RowType) {
  const { index, row } = props;
  const rowRef = useRef<HTMLDivElement>(null);
  const {
    accentColor,
    borderRadius,
    columns,
    isAddRowInProgress,
    listRef,
    multiRowSelection,
    prepareRow,
    primaryColumnId,
    rowHeights,
    rowNeedsMeasurement,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
  } = useContext(BodyContext);
  const [forceUpdate, setForceUpdate] = useState(0);
  const wrappingColumns = useColumnVariableHeight(columns);

  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [wrappingColumns]);

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
    const cellIndexesWithHTMLCell: number[] = [0];

    if (row?.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell, index: number) => {
        const typedCell = cell as unknown as CellWithColumnProps;

        // Use optional chaining to safely access nested properties
        if (typedCell?.column?.columnProperties?.allowCellWrapping) {
          cellIndexesWithAllowCellWrapping.push(index);
        }
      });
    }

    // Get all child elements
    const children = element.children;
    let normalCellHeight = 0;
    let htmlCellHeight = 0;

    cellIndexesWithAllowCellWrapping.forEach((index: number) => {
      const child = children[index] as HTMLElement;
      const dynamicContent = child.querySelector(
        ".t--table-cell-tooltip-target",
      );

      if (dynamicContent) {
        const styles = window.getComputedStyle(dynamicContent);

        normalCellHeight +=
          (dynamicContent as HTMLElement).offsetHeight +
          parseFloat(styles.marginTop) +
          parseFloat(styles.marginBottom) +
          parseFloat(styles.paddingTop) +
          parseFloat(styles.paddingBottom);
      }
    });

    cellIndexesWithHTMLCell.forEach((index: number) => {
      const child = children[index] as HTMLElement;
      const dynamicContent = child.querySelector(
        '[data-testid="t--table-widget-v2-html-cell"]>span',
      );

      if (dynamicContent) {
        const styles = window.getComputedStyle(dynamicContent);

        htmlCellHeight +=
          (dynamicContent as HTMLElement).offsetHeight +
          parseFloat(styles.marginTop) +
          parseFloat(styles.marginBottom) +
          parseFloat(styles.paddingTop) * 2 +
          parseFloat(styles.paddingBottom) * 2;
      }
    });

    const totalHeight =
      Math.max(normalCellHeight, htmlCellHeight) +
      TABLE_SIZES.DEFAULT.VERTICAL_PADDING * 2;

    rowHeights.current && (rowHeights.current[index] = totalHeight);
    rowNeedsMeasurement.current && (rowNeedsMeasurement.current[index] = false);
    listRef && listRef.current?.resetAfterIndex(index);
  }, [index, row, forceUpdate]);

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
