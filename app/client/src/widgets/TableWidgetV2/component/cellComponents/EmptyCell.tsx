import { pickBy } from "lodash";
import React, { CSSProperties } from "react";
import { Cell, Row } from "react-table";
import { ReactTableColumnProps, StickyType } from "../Constants";
import { EmptyCell, EmptyRow } from "../TableStyledWrappers";
import { renderBodyCheckBoxCell } from "./SelectionCheckboxCell";

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
          {row.cells.map((cell: Cell<Record<string, unknown>>) => {
            const cellProps = cell.getCellProps();
            return <div {...cellProps} className="td" key={cellProps.key} />;
          })}
        </div>
      );
    });
  } else {
    const tableColumns = columns.length
      ? columns
      : new Array(3).fill({ width: tableWidth / 3, isHidden: false });

    const lastLeftIdx = Object.keys(
      pickBy(tableColumns, { sticky: StickyType.LEFT }),
    ).length;

    const firstRightIdx =
      tableColumns.length -
      Object.keys(pickBy(tableColumns, { sticky: StickyType.RIGHT })).length;

    return rows.map((row: string, index: number) => {
      return (
        <EmptyRow className="tr" key={index} style={style}>
          {multiRowSelection &&
            renderBodyCheckBoxCell(false, accentColor, borderRadius)}
          {tableColumns.map((column: any, colIndex: number) => {
            const distanceFromEdge: { left?: number; right?: number } = {};
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
              distanceFromEdge["left"] =
                colIndex === 0 ? 0 : tableColumns[colIndex - 1].width;

              if (colIndex === lastLeftIdx - 1)
                stickyAttributes["data-sticky-last-left-td"] = true;
            } else if (column.sticky === StickyType.RIGHT) {
              distanceFromEdge["right"] =
                colIndex === tableColumns.length - 1
                  ? 0
                  : tableColumns[colIndex - 1].width;

              if (colIndex === firstRightIdx)
                stickyAttributes["data-sticky-first-right-td"] = true;
            }
            return (
              <EmptyCell
                className="td"
                {...stickyAttributes}
                key={colIndex}
                sticky={column.sticky}
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
