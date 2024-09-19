import { pickBy, sum } from "lodash";
import type { CSSProperties } from "react";
import React from "react";
import type { Cell, Row } from "react-table";
import type { ReactTableColumnProps } from "../Constants";
import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";
import { EmptyCell, EmptyRow } from "../TableStyledWrappers";
import { renderBodyCheckBoxCell } from "./SelectionCheckboxCell";

const addStickyModifierClass = (
  columns: ReactTableColumnProps[],
  cellIndex: number,
) => {
  return columns[cellIndex]?.sticky &&
    cellIndex !== 0 &&
    columns[cellIndex - 1].sticky === StickyType.RIGHT &&
    columns[cellIndex - 1].isHidden
    ? " sticky-right-modifier"
    : "";
};

export const renderEmptyRows = (
  rowCount: number,
  columns: ReactTableColumnProps[],
  tableWidth: number,
  page: Row<Record<string, unknown>>[],
  multiRowSelection = false,
  accentColor: string,
  borderRadius: string,
  style?: CSSProperties,
  prepareRow?: (row: Row<Record<string, unknown>>) => void,
) => {
  const rows: string[] = new Array(rowCount).fill("");

  if (page.length) {
    const row = page[0];

    return rows.map((item: string, index: number) => {
      prepareRow?.(row);
      const rowProps = {
        ...row.getRowProps(),
        style: {
          display: "flex",
          ...style,
        },
      };

      return (
        <div {...rowProps} className="tr" key={index}>
          {multiRowSelection &&
            renderBodyCheckBoxCell(false, accentColor, borderRadius)}
          {row.cells.map(
            (cell: Cell<Record<string, unknown>>, cellIndex: number) => {
              const cellProps = cell.getCellProps();
              const distanceFromEdge: {
                left?: number;
                right?: number;
                width?: string;
              } = {};

              if (
                multiRowSelection &&
                columns[cellIndex].sticky === StickyType.LEFT
              ) {
                distanceFromEdge["left"] =
                  cellIndex === 0
                    ? MULTISELECT_CHECKBOX_WIDTH
                    : MULTISELECT_CHECKBOX_WIDTH +
                      columns[cellIndex].columnProperties.width;
              }

              return (
                <div
                  {...cellProps}
                  className={
                    columns[cellIndex].isHidden
                      ? "td hidden-cell"
                      : `td${addStickyModifierClass(columns, cellIndex)}`
                  }
                  key={cellProps.key}
                  style={{ ...cellProps.style, ...distanceFromEdge }}
                />
              );
            },
          )}
        </div>
      );
    });
  } else {
    const tableColumns = columns.length
      ? columns
      : new Array(3).fill({ width: tableWidth / 3, isHidden: false });

    const lastLeftIdx = Object.keys(
      pickBy(tableColumns, { sticky: StickyType.LEFT, isHidden: false }),
    ).length;

    const firstRightIdx =
      tableColumns.length -
      Object.keys(pickBy(tableColumns, { sticky: StickyType.RIGHT })).length;

    return rows.map((row: string, index: number) => {
      return (
        <EmptyRow className="tr" key={index} style={style}>
          {multiRowSelection &&
            renderBodyCheckBoxCell(false, accentColor, borderRadius)}
          {/* TODO: Fix this the next time the file is edited */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {tableColumns.map((column: any, colIndex: number) => {
            const distanceFromEdge: {
              left?: number;
              right?: number;
              width?: string;
            } = {};
            const stickyAttributes: {
              "data-sticky-td"?: boolean;
              "data-sticky-last-left-td"?: boolean;
              "data-sticky-first-right-td"?: boolean;
            } =
              column.sticky !== StickyType.NONE
                ? {
                    ["data-sticky-td"]: true,
                  }
                : {};

            if (column.sticky === StickyType.LEFT) {
              const leftColWidths = tableColumns
                .slice(0, colIndex)
                .map((col) => col.width);

              if (multiRowSelection) {
                distanceFromEdge["left"] =
                  colIndex === 0
                    ? MULTISELECT_CHECKBOX_WIDTH
                    : sum(leftColWidths) + MULTISELECT_CHECKBOX_WIDTH;
              } else {
                distanceFromEdge["left"] =
                  colIndex === 0 ? 0 : sum(leftColWidths);
              }

              if (colIndex === lastLeftIdx - 1)
                stickyAttributes["data-sticky-last-left-td"] = true;
            } else if (column.sticky === StickyType.RIGHT) {
              const rightColWidths = tableColumns
                .slice(colIndex + 1, tableColumns.length)
                .map((col) => col.width);

              distanceFromEdge["right"] =
                colIndex === tableColumns.length - 1 ? 0 : sum(rightColWidths);

              if (colIndex === firstRightIdx)
                stickyAttributes["data-sticky-first-right-td"] = true;
            }

            return (
              <EmptyCell
                className={
                  column && column.isHidden
                    ? "td hidden-cell"
                    : `td${addStickyModifierClass(columns, colIndex)}`
                }
                {...stickyAttributes}
                key={colIndex}
                sticky={column?.sticky ?? StickyType.NONE}
                style={{ ...distanceFromEdge }}
                width={column.width}
              />
            );
          })}
        </EmptyRow>
      );
    });
  }
};
